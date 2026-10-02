import MainTitle from "@/components/MainTitle";
import ThemeToogle from "@/components/ThemeToogle";

function Profile() {
  return (
    <>
      <header className="flex items-center px-4">
        <MainTitle className="flex-1" title="Perfil" />
        <ThemeToogle />
      </header>
    </>
  );
}

export default Profile;
