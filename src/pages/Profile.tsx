import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BasicButton from "@/components/BasicButton";
import ProfileAvatar from "@/components/ProfileAvatar";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import ProfilePreferences from "@/components/ProfilePreferences";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import { useLogout } from "@/hooks/use-logout";
import { useAuth } from "@/hooks/use-auth";

function ProfileContent() {
  const { data: profile, isPending, isError, refetch } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const { sessionVersion: session } = useAuth();
  return (
    <>
      <Header title="Perfil" />
      <ToastViewport align="start" label="Avisos de perfil" className="shrink-0" />
      <ScrollArea
        role="region"
        aria-label="Perfil da empresa"
        maskHeight={0}
        className="min-h-0 flex-1 rounded-[40px] bg-surface-base md:rounded-[60px]"
        viewportClassName="overscroll-contain p-4 md:p-8 [&>div]:block!"
      >
        <div className="profile-layout grid min-w-0 gap-3.5">
          <div className="profile-information flex min-w-0 flex-col gap-6 rounded-[40px] bg-surface-background p-6">
            <ProfileAvatar className="mx-auto size-32 shrink-0" />
            {isPending ? (
              <>
                <Skeleton className="h-20 rounded-3xl" />
                <Skeleton className="h-20 rounded-3xl" />
              </>
            ) : isError || !profile ? (
              <div role="alert" className="flex flex-col gap-4">
                <p>Não foi possível carregar o perfil.</p>
                <BasicButton variant="secondary" onClick={() => void refetch()}>
                  Tentar novamente
                </BasicButton>
              </div>
            ) : (
              <>
                <dl className="flex min-w-0 flex-col gap-5">
                  <div className="flex min-w-0 flex-col gap-2.5">
                    <dt className="text-sm font-medium">Nome</dt>
                    <dd className="rounded-3xl bg-secondary-primary px-5 py-4 text-base font-medium [overflow-wrap:anywhere]">
                      {profile.nome}
                    </dd>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2.5">
                    <dt className="text-sm font-medium">E-mail vinculado</dt>
                    <dd className="rounded-3xl bg-secondary-primary px-5 py-4 text-base font-medium [overflow-wrap:anywhere]">
                      {profile.email}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-5">
                  <ProfileEditDialog key={`${profile.id}:${session}`} profile={profile} />
                </div>
              </>
            )}
            <BasicButton
              variant="secondary"
              onClick={() => {
                logout.mutate();
                void navigate("/login", { replace: true });
              }}
            >
              Sair
            </BasicButton>
          </div>
          <ProfilePreferences />
        </div>
      </ScrollArea>
    </>
  );
}

export default function Profile() {
  return (
    <ToastProvider>
      <ProfileContent />
    </ToastProvider>
  );
}
