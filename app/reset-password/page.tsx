import ResetPasswordForm from "./ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: {
    access_token?: string;
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <ResetPasswordForm accessToken={searchParams.access_token} />;
}
