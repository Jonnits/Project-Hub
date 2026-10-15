export const DEMO_PASSWORD = "demo";

export const DEMO_ACCOUNTS = [
  {
    id: "p-maya",
    name: "Maya Chen",
    email: "maya@projecthub.local",
    color: "#5E6AD2",
    role: "Staff engineer",
  },
  {
    id: "p-jordan",
    name: "Jordan Lee",
    email: "jordan@projecthub.local",
    color: "#26B5CE",
    role: "Product engineer",
  },
  {
    id: "p-sam",
    name: "Sam Okonkwo",
    email: "sam@projecthub.local",
    color: "#F2994A",
    role: "Mobile engineer",
  },
  {
    id: "p-riley",
    name: "Riley Patel",
    email: "riley@projecthub.local",
    color: "#EB5757",
    role: "Design engineer",
  },
] as const;

export function isDemoUserId(userId: string) {
  return DEMO_ACCOUNTS.some((account) => account.id === userId);
}
