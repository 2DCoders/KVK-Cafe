import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckSquare,
  Settings,
  ChevronDown,
  Coffee,
  Boxes,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getDayEndData } from "@/services/day-end-api";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

interface NavSubitem {
  id: string;
  label: string;
  path: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  submenu: NavSubitem[] | null;
}

export default function Sidebar({
  isOpen,
  isMobile,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = !isOpen && !isMobile;

  const [isDidDayEnd, setIsDidDayEnd] = useState(false);

  const cashier = localStorage.getItem("cashier")
    ? JSON.parse(localStorage.getItem("cashier") as string)
    : null;

  // const handleGetDayEndData = async () => {
  //   const today = new Date().toISOString().split("T")[0];

  //   try {
  //     const res = await getDayEndData(today);

  //     if (res && res.length > 0) {
  //       setIsDidDayEnd(true);
  //       localStorage.setItem("dayEndData", JSON.stringify(res[0]));
  //     } else {
  //       setIsDidDayEnd(false);
  //       localStorage.removeItem("dayEndData");
  //     }
  //   } catch (error) {
  //     setIsDidDayEnd(false);
  //     localStorage.removeItem("dayEndData");
  //   }
  // };

  // useEffect(() => {
  //   handleGetDayEndData();
  // }, []);

  // const canAccessMenu = (itemId: string) => {
  //   if (isDidDayEnd) return true;

  //   return itemId === "dayend";
  // };

  const navItems: NavItem[] = [
    {
      id: "menu",
      label: "Menu",
      icon: Coffee,
      path: "/menu",
      submenu: null,
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      path: "/payments",
      submenu: null,
    },
    {
      id: "dayend",
      label: "Day end",
      icon: CheckSquare,
      path: "/dayend",
      submenu: null,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      submenu: null,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);

    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Mobile drawer backdrop
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      <aside
        className={`${isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"} h-full w-full bg-white border-r border-[#E8D9CC] shadow-[0_0_0_1px_rgba(62,35,20,0.03)] transition-all duration-300 ease-in-out ${
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""
        } overflow-y-auto scrollbar-thin scrollbar-thumb-[#D8C2B0] scrollbar-track-transparent`}
      >
        <div className="flex flex-col h-full">

          {/* Brand Header */}
          <div className="px-4 pt-4 pb-3 border-b border-[#F0E5DC]">
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8B451F] to-[#5A2D16] text-white flex items-center justify-center shadow-sm">
                <Coffee size={17} />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2A160D] truncate">
                    KVK Cafe System
                  </p>

                  <p className="text-xs text-[#8A7465]">
                    Cashier Panel
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              const btnBase = `w-full flex items-center ${
                collapsed ? "justify-center" : "justify-between"
              } ${
                collapsed ? "px-2" : "px-3"
              } py-1.5 rounded-xl transition-colors duration-150`;

              const iconWrapper = `${
                active
                  ? "bg-[#F6E9DD] text-[#6E3619]"
                  : "text-[#9A8678]"
              } w-8 h-8 flex items-center justify-center rounded-lg transition`;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      // if (!canAccessMenu(item.id)) return;
                      handleNavigation(item.path);
                    }}
                    // disabled={!canAccessMenu(item.id)}
                    className={`${btnBase}
                      ${
                        active && !collapsed
                          ? "bg-[#F6E9DD] text-[#6E3619] shadow-sm"
                          : "text-[#4A372D] hover:bg-[#FAF5F1]"
                      }
                      cursor-pointer
                      ${
                        // !canAccessMenu(item.id)
                          // ? "opacity-50 cursor-not-allowed"
                          // : 
                          ""
                      }
                    `}
                  >
                    <div
                      className={`flex items-center gap-3 ${
                        collapsed ? "justify-center" : ""
                      }`}
                    >
                      <span className={iconWrapper}>
                        <Icon size={16} />
                      </span>

                      {!collapsed && (
                        <span
                          className={`text-sm ${
                            active
                              ? "text-[#6E3619] font-semibold"
                              : "text-[#4A372D]"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && item.submenu && (
                      <ChevronDown
                        size={16}
                        className="text-[#A69588]"
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.submenu && (
                    <div className="ml-3 space-y-1 animate-slide-up">
                      {item.submenu.map((subitem) => (
                        <button
                          key={subitem.id}
                          onClick={() =>
                            handleNavigation(subitem.path)
                          }
                          className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                            isActive(subitem.path)
                              ? "bg-[#F6E9DD] text-[#8B451F] font-medium"
                              : "text-[#66554A] hover:bg-[#FAF5F1]"
                          }`}
                        >
                          {subitem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto px-4 pb-4 pt-3 border-t border-[#F0E5DC] space-y-3">

            <div className="flex items-center gap-2 text-xs text-emerald-600">
              {!collapsed && (
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              )}

              {!collapsed && <span>System online</span>}
            </div>

            {!collapsed && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#E8D9CC] bg-[#FAF6F2] px-3 py-3 shadow-sm">

                <div className="w-8 h-8 rounded-full bg-[#F0DED0] text-[#7A3E18] flex items-center justify-center text-xs font-semibold">
                  {cashier?.firstName?.charAt(0)}
                  {cashier?.lastName?.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2A160D] truncate">
                    {cashier?.firstName} {cashier?.lastName}
                  </p>

                  <p className="text-xs text-[#8A7465]">
                    {cashier?.email}
                  </p>
                </div>
              </div>
            )}

            {collapsed && (
              <div className="w-8 h-8 rounded-full bg-[#F0DED0] text-[#7A3E18] flex items-center justify-center text-xs font-semibold">
                {cashier?.firstName?.charAt(0)}
                {cashier?.lastName?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}