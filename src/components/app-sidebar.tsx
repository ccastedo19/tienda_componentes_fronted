import * as React from "react"
import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  BookUser,
  Boxes,
  Building2,
  ChevronsUpDown,
  ClipboardList,
  FolderTree,
  GalleryVerticalEnd,
  HandCoins,
  History,
  House,
  LogOut,
  Monitor,
  Moon,
  Package,
  ShoppingCart,
  Sun,
  Tags,
  Users,
  Wallet,
  Wrench,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"

import logo from "../assets/img/logo.jpg"

import { Link, useLocation, useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "@/components/ui/dropdown-menu"
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  teams: [
    {
      name: "Lotus Electrónica",
      logo: GalleryVerticalEnd,
      logoImage: logo,
      plan: "Sistema de Inventario & POS",
    },
  ],
}

type NavLinkItem = {
  title: string
  url: string
  icon: React.ElementType
}

type NavSection = {
  title?: string
  items: NavLinkItem[]
}

function getNavigationSections(rol?: string): NavSection[] {
  const isAdmin = rol?.toLowerCase() === "administrador"

  if (!isAdmin) {
    return [
      {
        items: [
          { title: "Inicio", url: "/inicio", icon: House },
        ],
      },
      {
        title: "OPERACIONES",
        items: [
          { title: "Ventas", url: "/venta", icon: ArrowLeftRight },
          { title: "Cotización", url: "/cotizacion", icon: ClipboardList },
          { title: "Existencias (Stock)", url: "/existencias", icon: Boxes },
        ],
      },
      {
        title: "CAJA",
        items: [
          {
            title: "Apertura / Cierre",
            url: "/apertura-cierre",
            icon: Wallet,
          },
        ],
      },
      {
        title: "CONTACTOS",
        items: [
          { title: "Clientes", url: "/clientes", icon: BookUser },
        ],
      },
    ]
  }

  return [
    {
      items: [
        { title: "Inicio", url: "/inicio", icon: House },
      ],
    },
    {
      title: "OPERACIONES",
      items: [
        { title: "Ventas", url: "/venta", icon: ArrowLeftRight },
        { title: "Cotización", url: "/cotizacion", icon: ClipboardList },
        { title: "Compras", url: "/compra", icon: ShoppingCart },
        {
          title: "Taller / Recepciones",
          url: "/recepciones",
          icon: Wrench,
        },
        {
          title: "Devoluciones",
          url: "/devoluciones",
          icon: HandCoins,
        },
      ],
    },
    {
      title: "CAJA",
      items: [
        {
          title: "Apertura / Cierre",
          url: "/apertura-cierre",
          icon: Wallet,
        },
        {
          title: "Historial de Arqueos",
          url: "/historial-caja",
          icon: History,
        },
      ],
    },
    {
      title: "INVENTARIO",
      items: [
        {
          title: "Existencias (Stock)",
          url: "/existencias",
          icon: Boxes,
        },
        { title: "Productos", url: "/productos", icon: Package },
        { title: "Categorías", url: "/categorias", icon: Tags },
        { title: "Servicios", url: "/servicios", icon: FolderTree },
      ],
    },
    {
      title: "CONTACTOS",
      items: [
        { title: "Clientes", url: "/clientes", icon: BookUser },
        { title: "Proveedores", url: "/proveedores", icon: Users },
      ],
    },
    {
      title: "ANÁLISIS Y REPORTES",
      items: [
        {
          title: "Reporte de Ventas",
          url: "/reporte-ventas",
          icon: BarChart3,
        },
        {
          title: "Reporte de Cotizaciones",
          url: "/reporte-cotizaciones",
          icon: ClipboardList,
        },
        {
          title: "Kardex y Mermas",
          url: "/kardex-inventario",
          icon: Archive,
        },
      ],
    },
    {
      title: "SISTEMA",
      items: [
        { title: "Usuarios", url: "/usuarios", icon: Users },
        {
          title: "Datos de Empresa",
          url: "/datos-empresa",
          icon: Building2,
        },
        {
          title: "Auditoría & Backup",
          url: "/backup",
          icon: Archive,
        },
      ],
    },
  ]
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
  const activeTeam = teams[0]

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
                className="size-8 rounded-lg object-cover"
              />
            ) : (
              <activeTeam.logo className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{activeTeam.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {activeTeam.plan}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavMain({ sections }: { sections: NavSection[] }) {
  const location = useLocation()

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup
          key={section.title ?? "inicio"}
          className={section.title ? "px-2 pt-2.5 pb-0.5" : "px-2 py-0.5"}
        >
          {section.title ? (
            <SidebarGroupLabel className="mb-0.5 h-5 px-2 text-[10px] font-semibold tracking-wide uppercase">
              {section.title}
            </SidebarGroupLabel>
          ) : null}
          <SidebarMenu>
            {section.items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={location.pathname === item.url}
                  render={<Link to={item.url} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
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
              <AvatarFallback className="bg-zinc-200 text-zinc-700 transition-colors group-hover/user-menu:bg-zinc-300 dark:bg-[#171717] dark:text-white dark:group-hover/user-menu:bg-[#262626]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{fullName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.rol} • {user.email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-200 text-zinc-700 dark:bg-[#171717] dark:text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{fullName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.rol} • {user.email}
                    </span>
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
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
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
  const { user } = useAuth()
  const navSections = React.useMemo(
    () => getNavigationSections(user?.rol),
    [user?.rol]
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navSections} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
