const { default: MANAGERS } = require("../managers");
const axios = require('axios');
const queryLimiter = require('../utilities/queryLimiter')

const axiosInstance = axios.create({
    baseURL: `https://${process.env.AMO_CRM_SUBDOMAIN}.amocrm.ru/api/v4/`,
    headers: {
        'Authorization': `Bearer ${process.env.AMO_CRM_ACCESS_TOKEN}`
    },
});


class AmoService {
    async getLatestCall(leadId) {
        try {
            if (!queryLimiter.queryabilityCheck()) return queryLimiter.getErrorStatus('Amo');
            const leadResponse = await axiosInstance.get(`leads/${leadId}?with=contacts`);
            const contacts = leadResponse.data?._embedded?.contacts || [];

            let relatedLeads = [leadId];
            for (const contact of contacts) {
                const contactId = contact.id;
                if (!queryLimiter.queryabilityCheck()) return queryLimiter.getErrorStatus('Amo');
                const contactResponse = await axiosInstance.get(`contacts/${contactId}?with=leads`);
                const contactData = contactResponse.data
                if (contactData?._embedded?.leads) {
                    relatedLeads.push(...contactData._embedded.leads.map(lead => lead.id));
                }
            }

            let latestManagerCall = null;
            let earliestCall = null;

            for (const lead of relatedLeads) {
                if (!queryLimiter.queryabilityCheck()) return queryLimiter.getErrorStatus('Amo');
                const callsResponse = await axiosInstance.get(
                    'events',
                    {
                        params: {
                            "filter[entity]": "lead",
                            "filter[entity_id]": lead,
                            "filter[type]": "outgoing_call"
                        }
                    }
                );
                for (const call of callsResponse.data?._embedded?.events || []) {
                    const { created_by, created_at, entity_id } = call;
                    const isManager = created_by in MANAGERS;

                    if (isManager && (!latestManagerCall || created_at > latestManagerCall.created_at)) {
                        latestManagerCall = { created_by, created_at, entity_id };
                    }
                    if (!earliestCall || created_at < earliestCall.created_at) {
                        earliestCall = { created_by, created_at, entity_id };
                    }
                }
            }

            let latest = latestManagerCall || earliestCall;
            if (!latest) {
                return {
                    status: 404,
                    data: { error: "Нет звонков" }
                }
            }

            const createdBy = latestManagerCall ? MANAGERS[latest.created_by] : `ID: ${latest.created_by}`;
            const createdAtMoscow = new Date(latest.created_at * 1000 + 3 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);

            return {
                status: 200,
                data: {
                    created_by: createdBy,
                    created_at: createdAtMoscow,
                    entity_id: latest.entity_id
                }
            };
        } catch (error) {
            console.error("Error processing request:", error);
        }
    }
}

module.exports = new AmoService();