import * as React from 'react'
import {
  AudioWaveform,
  BarChart3,
  BookUser,
  ChevronRight,
  ChevronsUpDown,
  Command,
  GalleryVerticalEnd,
  House,
  LogOut,
  Monitor,
  Moon,
  Settings2,
  Sun,
  Wallet,
  Wrench,
  ArrowLeftRight,
} from 'lucide-react'
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme";

import logo from '../assets/img/logo.jpg';

import { Link, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const data = {
  teams: [
    {
      name: 'Lotus Electrónica',
      logo: GalleryVerticalEnd, 
      logoImage: logo,
      plan: 'Sistema de Inventario & POS',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
}

function getNavigationItems(rol?: string) {
  const isAdmin = rol?.toLowerCase() === 'administrador';

  if (!isAdmin) {
    return [
      {
        title: "Inicio",
        url: "/inicio",
        icon: House,
      },
      {
        title: "Punto de Venta (POS)",
        url: "/venta",
        icon: ArrowLeftRight,
      },
      {
        title: "Operaciones",
        icon: ArrowLeftRight,
        items: [
          {
            title: "Existencias (Stock)",
            url: "/existencias",
          },
          {
            title: "Cotización",
            url: "/cotizacion",
          },
          {
            title: "Clientes",
            url: "/clientes",
          },
        ],
      },
      {
        title: "Caja",
        icon: Wallet,
        items: [
          {
            title: "Apertura / Cierre",
            url: "/apertura-cierre",
          },
        ],
      },
    ];
  }

  return [
    {
      title: "Inicio",
      url: "/inicio",
      icon: House,
    },
    {
      title: "Directorios",
      icon: BookUser,
      items: [
        {
          title: "Personal / Usuarios",
          url: "/usuarios",
        },
        {
          title: "Clientes",
          url: "/clientes",
        },
      ],
    },
    {
      title: "Operaciones",
      icon: ArrowLeftRight,
      items: [
        {
          title: "Existencias (Stock)",
          url: "/existencias",
        },
        {
          title: "Venta (POS)",
          url: "/venta",
        },
        {
          title: "Compras de Inventario",
          url: "/compra",
        },
        {
          title: "Cotización",
          url: "/cotizacion",
        },
        {
          title: "Taller / Recepciones",
          url: "/recepciones",
        },
      ],
    },
    {
      title: "Caja",
      icon: Wallet,
      items: [
        {
          title: "Apertura / Cierre",
          url: "/apertura-cierre",
        },
        {
          title: "Historial de Arqueos",
          url: "/historial-caja",
        },
      ],
    },
    {
      title: "Análisis y Reportes",
      icon: BarChart3,
      items: [
        {
          title: "Reporte de Ventas",
          url: "/reporte-ventas",
        },
        {
          title: "Reporte de Cotizaciones",
          url: "/reporte-cotizaciones",
        },
        {
          title: "Kardex y Mermas",
          url: "/kardex-inventario",
        },
      ],
    },
    {
      title: "Mantenimiento",
      icon: Wrench,
      items: [
        {
          title: "Productos",
          url: "/productos",
        },
        {
          title: "Servicios",
          url: "/servicios",
        },
        {
          title: "Categorías",
          url: "/categorias",
        },
        {
          title: "Proveedores",
          url: "/proveedores",
        },
      ],
    },
    {
      title: "Configuración",
      icon: Settings2,
      items: [
        {
          title: "Datos de Empresa",
          url: "/datos-empresa",
        },
        {
          title: "Auditoría & Backup",
          url: "/backup",
        },
      ],
    },
  ];
}

function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    logoImage?: string
    plan: string
  }[]
}) {
  const activeTeam = teams[0];

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            {activeTeam.logoImage ? (
              <img 
                src={logo} 
                alt={activeTeam.name}
                className="size-8 object-cover rounded-lg"
              />
            ) : (
              <activeTeam.logo className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{activeTeam.name}</span>
            <span className="truncate text-xs text-muted-foreground">{activeTeam.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: React.ElementType
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menú</SidebarGroupLabel>
      <SidebarMenu>
      {items.map((item) => {
        const isItemActive = item.url === location.pathname
        const isSubItemActive = item.items?.some(
          (subItem) => location.pathname === subItem.url
        )
        const isActive = isItemActive || isSubItemActive

        return item.items && item.items.length > 0 ? (
          <Collapsible
            key={item.title}
            defaultOpen={isActive || item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                  />
                }
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>

                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        isActive={location.pathname === subItem.url}
                        render={<Link to={subItem.url} />}
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isItemActive}
              render={<Link to={item.url ?? "/"} />}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function getInitials(nombre: string, apellido: string) {
  const first = nombre.trim().charAt(0)
  const last = apellido.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || "U"
}

function NavUser() {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const fullName = `${user.nombre} ${user.apellido}`.trim()
  const initials = getInitials(user.nombre, user.apellido)

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="group/user-menu bg-transparent text-sidebar-foreground transition-colors hover:bg-zinc-200 hover:text-zinc-900 data-[state=open]:bg-zinc-200 data-[state=open]:text-zinc-900 dark:bg-[#171717] dark:text-white dark:hover:bg-[#262626] dark:hover:text-white dark:data-[state=open]:bg-[#262626] dark:data-[state=open]:text-white"
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-zinc-200 text-zinc-700 transition-colors group-hover/user-menu:bg-zinc-300 dark:bg-[#171717] dark:text-white dark:group-hover/user-menu:bg-[#262626]">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{user.rol} • {user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-200 text-zinc-700 dark:bg-[#171717] dark:text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{fullName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.rol} • {user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>Tema Visual</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value)}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className="size-4" />
                  Claro
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="size-4" />
                  Oscuro
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="size-4" />
                  Sistema
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="size-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const navItems = React.useMemo(() => getNavigationItems(user?.rol), [user?.rol]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
