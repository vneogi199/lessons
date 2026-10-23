export const PRIORITY_PREPARATION = {
  "0506": "aws", "0359": "database", "0438": "database",
  "0597": "evaluation", "0614": "evaluation", "0288": "python",
  "0341": "python", "0520": "operations", "0576": "operations",
  "0259": "node", "0413": "node", "0621": "impact", "0618": "delivery",
};
export const prioritySearch = "senior preparation AWS Terraform PostgreSQL reliability AI evaluation Python concurrency Kubernetes Node TypeScript GraphQL architecture impact customer delivery evidence";
export function priorityDepth(number) {
  const section = PRIORITY_PREPARATION[number];
  return section ? `<section class="card" data-priority-preparation><h2>Practise this skill in one end-to-end project</h2><p>Follow the <a href="../reference/senior-priority-build-path.html#${section}" target="_blank" rel="noreferrer">guided build, failure drill and interview checkpoint</a>. Record what you personally implemented and measured. Supplied labs, integration plans and actual deployments are different kinds of evidence.</p></section>` : "";
}
