import ResetPasswordForm from "./ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <ResetPasswordForm searchParams={searchParams} />;
}
