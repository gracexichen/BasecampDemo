import { ButtonLink, Card, EmptyState } from "../components/ui";

export function NotFound() {
  return (
    <Card>
      <EmptyState icon="doc" title="Page not found">
        <p>That page doesn't exist in this prototype.</p>
        <div className="mt-4">
          <ButtonLink to="/" variant="primary">
            Go to Dashboard
          </ButtonLink>
        </div>
      </EmptyState>
    </Card>
  );
}
