'use client'

import { Calendar, CreditCard, Building, ChartLine, Users, Settings, LogOut, ChartBar, UserCog } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  user: { name: string; role: string };
  onLogout: () => void;
}

export function Sidebar({ activeView, setActiveView, user, onLogout }: SidebarProps) {
  // Define all menu items with role restrictions
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartLine, roles: ['admin', 'manager', 'staff'] },
    { id: 'bookings', label: 'Bookings', icon: Calendar, roles: ['admin', 'manager', 'staff'] },
    { id: 'hotels', label: 'Hotels', icon: Building, roles: ['admin', 'manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'manager', 'staff'] },
    { id: 'reports', label: 'Reports', icon: ChartBar, roles: ['admin', 'manager'] },
    { id: 'users', label: 'Users', icon: UserCog, roles: ['admin'] },
  ];

  if (!user) return null;

  // Filter menu items based on user role
  const userRole = user.role.toLowerCase();
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 shadow-sm">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">Muraka</h1>
          <p className="text-sm text-gray-500">Hotels</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}