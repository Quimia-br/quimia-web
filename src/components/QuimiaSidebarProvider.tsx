import { SidebarProvider } from './ui/sidebar';
import Menu from './Menu';
import { Outlet } from 'react-router-dom';

function Sidebar() {
  return (
    <SidebarProvider
      className="flex w-full gap-5 h-screen p-8"
    >
      <Menu />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </SidebarProvider>
  )
}

export default Sidebar
