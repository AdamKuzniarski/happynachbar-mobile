export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-600 whitespace-pre-line">{message}</p>;
}
