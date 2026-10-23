'use client';

import { useRouterState } from '@/lib/router-compat';
import { hasPrimaryNavigation } from '@/lib/nav/dashboardNavigation';
export function DashboardContentFrame({children}:{children:React.ReactNode}){const path=useRouterState({select:s=>s.location.pathname});return <div className={'flex min-w-0 flex-1 flex-col '+(hasPrimaryNavigation(path)?'has-bottom':'')}>{children}</div>}
