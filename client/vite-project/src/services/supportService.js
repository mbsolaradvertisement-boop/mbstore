import api from "../lib/api";
export const supportApi={
 dashboard:()=>api.get('/support/dashboard'), agents:()=>api.get('/support/agents'), tickets:params=>api.get('/support/tickets',{params}), ticket:id=>api.get(`/support/tickets/${id}`),
 createTicket:data=>api.post('/support/tickets',data), updateTicket:(id,data)=>api.put(`/support/tickets/${id}`,data), assign:id=>api.post(`/support/tickets/${id}/assign`),
 message:(id,data)=>api.post(`/support/tickets/${id}/messages`,data), note:(id,note)=>api.post(`/support/tickets/${id}/internal-notes`,{note}),
 forward:(id,target,data)=>api.post(`/support/tickets/${id}/forward-to-${target}`,data), directory:type=>api.get(`/support/${type}`),
 followUps:()=>api.get('/support/follow-ups'), createFollowUp:data=>api.post('/support/follow-ups',data), updateFollowUp:(id,data)=>api.put(`/support/follow-ups/${id}`,data),
 notifications:()=>api.get('/support/notifications'), readNotification:id=>api.put(`/support/notifications/${id}/read`), profile:()=>api.get('/support/profile'), updateProfile:data=>api.put('/support/profile',data)
};
