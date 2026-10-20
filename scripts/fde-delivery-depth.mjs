export const FDE_DELIVERY = {
  "0068": ["Discovery, Mom Test, 5 Whys, personas and jobs-to-be-done", "fde-discovery-to-adoption.html#discovery"],
  "0411": ["ERP SAP OData API_EQUIPMENT BAPI RFC IDoc CPI Datasphere", "erp-sap-integration.html"],
  "0618": ["BPMN swim-lanes AS-IS TO-BE BRD TDD client discovery", "fde-discovery-to-adoption.html#process"],
  "0620": ["UAT go-live hypercare ADKAR handover ROI field-service KPIs", "fde-discovery-to-adoption.html#acceptance"],
  "0638": ["Stakeholder workshops scope communication BRD change control", "fde-discovery-to-adoption.html#communication"],
};
export function fdeDeliveryDepth(number) {
  const entry = FDE_DELIVERY[number];
  if (!entry) return "";
  return `<section class="card" data-fde-delivery-depth><h2>Practise client delivery</h2><p>${entry[0]}. Follow the <a href="../reference/${entry[1]}" target="_blank" rel="noreferrer">worked FDE lesson</a>, then complete one exercise before opening its answer. The linked field-service pack provides requirements, API contracts, failure paths and UAT cases. Examples are synthetic; live integrations are not verified.</p></section>`;
}
