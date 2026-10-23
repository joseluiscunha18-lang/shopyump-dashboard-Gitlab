'use client';

import {useState} from 'react';
import {Link} from '@/lib/router-compat';
import {Check,CheckSquare,MoreHorizontal,Square,Trash2} from 'lucide-react';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {useDashboardState,type DashboardNotification} from './DashboardState';

const KIND_LABEL:Record<DashboardNotification['tipo'],string>={pedido:'Pedido',estado:'Pedido',stock:'Stock',atencao:'Atenção',plataforma:'Aviso',boas_vindas:'Informação',pagamento:'Pagamento',entrega:'Entrega'};
const isAttention=(n:DashboardNotification)=>n.tipo==='stock'||n.tipo==='atencao'||n.tipo==='plataforma';

/** Uma notificação: hierarquia título → resumo → tempo; acções discretas. */
export function NotificationItem({n,compact,onNavigate}:{n:DashboardNotification;compact?:boolean;onNavigate?:()=>void}){
 const {setNotifications}=useDashboardState();const [menu,setMenu]=useState(false);const [confirm,setConfirm]=useState(false);
 const markRead=()=>setNotifications(l=>l.map(x=>x.id===n.id?{...x,lida:true}:x));
 const body=<><span className={'notif-kind '+(isAttention(n)?'is-attention':'')}>{KIND_LABEL[n.tipo]}</span><span className="notif-title">{n.titulo}</span><span className="notif-text">{n.texto}</span><span className="notif-time">{n.quando}</span></>;
 return <div className={'notif-item '+(n.lida?'is-read':'is-unread')+(compact?' is-compact':'')}>
  <span className="notif-dot" aria-label={n.lida?undefined:'Não lida'}/>
  {n.link?<Link to={n.link} search={(n.link==='/pedidos'&&n.tipo==='pedido'?{filtro:'novos'}:undefined) as never} className="notif-body" onClick={()=>{markRead();onNavigate?.()}}>{body}</Link>:<div className="notif-body">{body}</div>}
  {compact?(!n.lida&&<button type="button" className="notif-action" aria-label={'Marcar como lida: '+n.titulo} title="Marcar como lida" onClick={markRead}><Check size={16}/></button>)
  :<div className="relative"><button type="button" className="notif-action" aria-label={'Acções: '+n.titulo} aria-expanded={menu} onClick={()=>setMenu(!menu)}><MoreHorizontal size={18}/></button>
   {menu&&<div className="notif-menu" role="menu" onMouseLeave={()=>setMenu(false)}>
    {!n.lida&&<button type="button" role="menuitem" onClick={()=>{markRead();setMenu(false)}}><Check size={15}/>Marcar como lida</button>}
    <button type="button" role="menuitem" className="is-danger" onClick={()=>{setMenu(false);setConfirm(true)}}><Trash2 size={15}/>Eliminar</button>
   </div>}</div>}
  <ConfirmDialog open={confirm} onClose={()=>setConfirm(false)} title="Eliminar notificação?" description={'«'+n.titulo+'» será removida do histórico.'} confirmLabel="Eliminar" onConfirm={()=>setNotifications(l=>l.filter(x=>x.id!==n.id))}/>
 </div>;
}

/** Painel rápido aberto pelo sino. */
export function NotificationsQuickPanel({onClose}:{onClose:()=>void}){
 const {notifications,setNotifications}=useDashboardState();const unread=notifications.filter(n=>!n.lida).length;const recent=notifications.filter(n=>!n.lida).slice(0,3);
 return <div className="menu-panel notif-panel" role="dialog" aria-label="Notificações">
  <div className="notif-panel-head"><h2>Notificações{unread>0&&<span className="notif-count">{unread}</span>}</h2>{unread>0&&<button type="button" className="notif-link" onClick={()=>setNotifications(l=>l.map(n=>({...n,lida:true})))}>Marcar todas como lidas</button>}</div>
  <div className="notif-panel-list">{recent.length?recent.map(n=><NotificationItem key={n.id} n={n} compact onNavigate={onClose}/>):<div className="notif-empty"><strong>Está tudo em dia!</strong><span>Não tem notificações novas.</span></div>}</div>
  <Link to="/notificacoes" className="notif-panel-foot" onClick={onClose}>{recent.length?'Ver todas as notificações':'Ver histórico'}</Link>
 </div>;
}

/** Operações sobre o registo de notificações (único ponto a ligar à fonte real).
 * Eliminar remove apenas a notificação — nunca o pedido/produto associado. */
export function useNotificationActions(){
 const {notifications,setNotifications}=useDashboardState();
 const setRead=(ids:number[],lida:boolean)=>setNotifications(l=>l.map(n=>ids.includes(n.id)?{...n,lida}:n));
 const remove=(ids:number[])=>setNotifications(l=>l.filter(n=>!ids.includes(n.id)));
 return {notifications,setRead,remove,markAllRead:()=>setNotifications(l=>l.map(n=>({...n,lida:true}))),removeAll:()=>setNotifications([])};
}

const PAGE_LABEL:Record<DashboardNotification['tipo'],string>={pedido:'Pedido',estado:'Pedido',stock:'Stock',atencao:'Atenção',plataforma:'Informação',boas_vindas:'Informação',pagamento:'Pagamento',entrega:'Entrega'};

function PageItem({n,onAsk,selecting,selected,onToggle}:{n:DashboardNotification;onAsk:(ids:number[])=>void;selecting?:boolean;selected?:boolean;onToggle?:(id:number)=>void}){
 const {setRead}=useNotificationActions();
 const body=<><span className="notif-meta"><span className={'notif-kind '+(isAttention(n)?'is-attention':'')}>{PAGE_LABEL[n.tipo]}</span><span className="notif-time">{n.quando}</span></span><span className="notif-title">{n.titulo}</span><span className="notif-text">{n.texto}</span></>;
 return <li className={'notif-item '+(n.lida?'is-read':'is-unread')+(selected?' is-selected':'')}>
  {selecting
   ?<button type="button" className="notif-check" role="checkbox" aria-checked={!!selected} aria-label={'Selecionar: '+n.titulo} onClick={()=>onToggle?.(n.id)}>{selected?<CheckSquare size={18}/>:<Square size={18}/>}</button>
   :<span className="notif-dot" aria-label={n.lida?undefined:'Não lida'}/>}
  {selecting
   ?<button type="button" className="notif-body" onClick={()=>onToggle?.(n.id)}>{body}</button>
   :n.link?<Link to={n.link} search={(n.link==='/pedidos'&&n.tipo==='pedido'?{filtro:'novos'}:undefined) as never} className="notif-body" onClick={()=>setRead([n.id],true)}>{body}</Link>:<div className="notif-body">{body}</div>}
 </li>;
}

export function NotificacoesView(){
 const {notifications,remove,removeAll,markAllRead}=useNotificationActions();
 const [filter,setFilter]=useState<'todas'|'nao-lidas'>('todas');const [ask,setAsk]=useState<number[]|null>(null);
 const [selecting,setSelecting]=useState(false);const [selected,setSelected]=useState<number[]>([]);
 const [askAll,setAskAll]=useState(false);const [bulk,setBulk]=useState(false);
 const unread=notifications.filter(n=>!n.lida).length;const list=notifications.filter(n=>filter==='todas'||!n.lida);
 const has=notifications.length>0;
 const toggle=(id:number)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const stopSelecting=()=>{setSelecting(false);setSelected([]);};
 const visibleIds=list.map(n=>n.id);const allVisible=visibleIds.length>0&&visibleIds.every(id=>selected.includes(id));
 return <div className="notif-page">
  {has&&<div className="notif-toolbar">
   {selecting?<>
    <button type="button" className="notif-link-btn" onClick={()=>setSelected(allVisible?[]:visibleIds)}>{allVisible?'Desmarcar':'Selecionar todas'}</button>
    <div className="notif-toolbar-actions">
     <button type="button" className="notif-link-btn is-danger" disabled={!selected.length} onClick={()=>setAsk(selected)}>Eliminar{selected.length>0?' ('+selected.length+')':''}</button>
     <button type="button" className="notif-link-btn" onClick={stopSelecting}>Cancelar</button>
    </div>
   </>:<>
   <div className="notif-tabs" role="tablist" aria-label="Filtrar notificações">
    <button type="button" role="tab" aria-selected={filter==='todas'} onClick={()=>setFilter('todas')}>Todas</button>
    <button type="button" role="tab" aria-selected={filter==='nao-lidas'} onClick={()=>setFilter('nao-lidas')}>Não lidas{unread>0&&<span className="notif-count">{unread}</span>}</button>
   </div>
   <div className="notif-toolbar-actions">
    <>
     <div className="relative"><button type="button" className="notif-action" aria-label="Mais ações" aria-haspopup="menu" aria-expanded={bulk} onClick={()=>setBulk(!bulk)}><MoreHorizontal size={20}/></button>
      {bulk&&<><div className="fixed inset-0 z-10" onClick={()=>setBulk(false)}/><div className="notif-menu" role="menu">
       {unread>0&&<button type="button" role="menuitem" onClick={()=>{markAllRead();setBulk(false)}}><Check size={15}/>Marcar todas como lidas</button>}
       <button type="button" role="menuitem" onClick={()=>{setSelecting(true);setBulk(false)}}><CheckSquare size={15}/>Selecionar</button>
       <button type="button" role="menuitem" className="is-danger" onClick={()=>{setAskAll(true);setBulk(false)}}><Trash2 size={15}/>Eliminar todas</button>
      </div></>}</div>
    </>
   </div>
   </>}
  </div>}
  {!has?<p className="notif-empty">Não tens notificações.</p>:!list.length?<p className="notif-empty">Está tudo em dia! Não tens notificações por ler.</p>:
   <ul className="notif-list">{list.map(n=><PageItem key={n.id} n={n} onAsk={setAsk} selecting={selecting} selected={selected.includes(n.id)} onToggle={toggle}/>)}</ul>}
  <ConfirmDialog open={!!ask} onClose={()=>setAsk(null)} danger title={ask&&ask.length>1?'Eliminar notificações?':'Eliminar notificação?'}
   description={ask&&ask.length>1?'Tens a certeza de que pretendes eliminar '+ask.length+' notificações? Esta ação não pode ser desfeita.':'Tens a certeza de que pretendes eliminar esta notificação? Esta ação não pode ser desfeita.'}
   confirmLabel="Eliminar" onConfirm={()=>{remove(ask??[]);stopSelecting();}}/>
  <ConfirmDialog open={askAll} onClose={()=>setAskAll(false)} danger title="Eliminar todas as notificações?"
   description="Tens a certeza de que pretendes eliminar todas as notificações? Esta ação não pode ser desfeita."
   confirmLabel="Eliminar todas" onConfirm={()=>{removeAll();stopSelecting();}}/>
 </div>;
}
