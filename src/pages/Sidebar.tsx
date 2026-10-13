import { SidebarProvider } from '../components/ui/sidebar';
import Menu from '../components/Menu';
import { Outlet } from 'react-router-dom';

function Sidebar() {
  return (
    <SidebarProvider
      className="relative flex w-full h-screen gap-5 p-8 overflow-hidden"
    >
      <Menu />
      <main className="flex flex-col flex-1 min-w-0 gap-6">
        <Outlet />
      </main>
    </SidebarProvider>
  )
}

export default Sidebar
