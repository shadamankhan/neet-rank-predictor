export const ADMIN_EMAILS = [
    "shadamankhan@gmail.com",
    "deepclasses1@gmail.com",
    "admin@example.com"
];

export function isAdminEmail(email) {
    if (!email) return false;
    return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
