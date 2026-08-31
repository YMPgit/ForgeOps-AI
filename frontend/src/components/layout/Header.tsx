import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Settings, MessageSquare, Clock, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useHistory } from '@/hooks/useQuery';
import { Sun, Moon } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ask-data': 'Ask Data',
  '/data-sources': 'Data Sources',
  '/query-history': 'Query History',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { data: history = [] } = useHistory();
  const title = pageTitles[location.pathname] || 'Talk to Data';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  const recentActivity = history.slice(0, 4);

  const handleSearch = () => {
    navigate('/ask-data');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleSearch} title="Ask your data">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" title="Recent activity">
              <Bell className="h-4 w-4" />
              {history.length > 0 && (
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Recent Activity</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No queries yet</p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex items-start gap-2"
                  onClick={() =>
                    item.session_id
                      ? navigate(`/ask-data?session=${encodeURIComponent(item.session_id)}`)
                      : navigate('/ask-data', { state: { question: item.question } })
                  }
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.question}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleString()}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          item.status === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/query-history" className="justify-center text-xs font-medium">
                View all history
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-medium text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
