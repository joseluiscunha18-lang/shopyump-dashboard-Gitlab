'use client';

import { Link,useRouterState } from '@/lib/router-compat';
import { Plus } from 'lucide-react';
import { HomeIcon, ProductsIcon, OrdersIcon, AnalyticsIcon } from './NavigationIcons';
import { bottomNavigationItems } from '@/lib/nav/bottomNavigationItems';
import { hasPrimaryNavigation } from '@/lib/nav/dashboardNavigation';
import { useMobileNav } from './MobileNavContext';
const icons = { '/dashboard': HomeIcon, '/pedidos': OrdersIcon, '/produtos/novo': Plus, '/produtos': ProductsIcon, '/analises': AnalyticsIcon };
const items = bottomNavigationItems.map(item => ({ ...item, icon: icons[item.to] }));
export function BottomNav({initialPedidosPendentes=0}:{lojaId?:string;initialPedidosPendentes?:number}){const path=useRouterState({select:s=>s.location.pathname});const {menuOpen}=useMobileNav();if(!hasPrimaryNavigation(path))return null;return <nav className={'bottom-primary '+(menuOpen?'is-hidden':'')} aria-label="Navegação inferior" inert={menuOpen}><div className="bottom-primary-inner">{items.map(i=>{const action=i.label==='Adicionar';const active=path===i.to;return <Link key={i.to} to={i.to} search={(i.to==='/pedidos'&&initialPedidosPendentes>0?{filtro:'novos'}:undefined) as never} aria-label={i.label} title={i.label} aria-current={active?'page':undefined} className={(active?'active ':'')+(action?'add-action':'')}><span className={action?'bottom-add':'bottom-icon'}>{i.to==='/dashboard'?<HomeIcon size={25}/>:<i.icon size={action?22:25} strokeWidth={action?2.2:1.8}/>} {i.to==='/pedidos'&&initialPedidosPendentes>0&&<span className="bottom-order-badge">{initialPedidosPendentes>99?'99+':initialPedidosPendentes}</span>}</span><span className="bottom-label">{i.label}</span></Link>})}</div></nav>}
