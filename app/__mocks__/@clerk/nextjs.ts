export const auth = () => ({ userId: 'test_user_123' })
export const currentUser = () => Promise.resolve({ id: 'test_user_123', firstName: 'Test' })
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => children
export const SignIn = () => null
export const SignUp = () => null
export const SignOutButton = () => null
export const UserButton = () => null
