'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserContext } from '@/lib/auth/getUserContext';
import type { Loja } from '@/types/database';
import { defaultBusinessHours } from '@/lib/settings/model';
import type { StoreStatus, StoreData, Contacts, Region, Delivery, Checkout, Payments } from '@/lib/settings/model';
export type DashboardNotification = {id:number;tipo:'pedido'|'estado'|'stock'|'atencao'|'plataforma'|'boas_vindas'|'pagamento'|'entrega';titulo:string;texto:string;quando:string;lida:boolean;link?:'/pedidos'|'/produtos'|'/configuracoes'};
/** Sem notificações simuladas: a lista começa vazia (as reais virão dos pedidos/estado da loja). */
export const initialNotifications:DashboardNotification[] = [];
export type SocialLink = {id:number;nome:string;url:string;visivel:boolean};
export type ContentPage = {slug:string;titulo:string;resumo:string;texto:string;publicada:boolean};
const buildPages=(demoLoja:Loja):ContentPage[] => [
 {slug:'sobre',titulo:'Sobre a loja',resumo:'',texto:demoLoja.conteudo_sobre ?? '',publicada:Boolean(demoLoja.mostrar_sobre)},
 {slug:'contacto',titulo:'Contacto',resumo:'',texto:'',publicada:false},
 {slug:'faq',titulo:'Perguntas frequentes',resumo:'',texto:'',publicada:false},
 {slug:'privacidade',titulo:'Política de privacidade',resumo:'',texto:'',publicada:false},
 {slug:'termos',titulo:'Termos e condições',resumo:'',texto:demoLoja.conteudo_termos ?? '',publicada:Boolean(demoLoja.mostrar_termos)},
 {slug:'devolucoes',titulo:'Política de devoluções',resumo:'',texto:'',publicada:false},
 {slug:'entrega',titulo:'Política de entrega',resumo:'',texto:demoLoja.conteudo_entrega ?? '',publicada:Boolean(demoLoja.mostrar_entrega)},
];
export type Appearance='claro'|'escuro'|'sistema';
export type DashboardLanguage='pt'|'en';
/** Conta pessoal simulada. `foto` é a fotografia pessoal (nunca o logótipo da loja). */
export type DemoAccount={nome:string;email:string;telefone:string;avatar:string;foto:string|null;googleFoto:string|null;metodoAcesso:'password'|'google'};
const buildAccount=(ctx:UserContext):DemoAccount=>({nome:ctx.nome??'',email:ctx.email??'',telefone:'',avatar:'initials',foto:ctx.foto,googleFoto:ctx.foto,metodoAcesso:ctx.metodoAcesso});
export type DashboardInit={ctx:UserContext;loja:Loja};
function useStateValue({ctx,loja:demoLoja}:DashboardInit){
 const [notifications,setNotifications]=useState(initialNotifications);
 const [account,setAccount]=useState<DemoAccount>(()=>buildAccount(ctx));
 const [appearance,setAppearanceState]=useState<Appearance>('claro');
 const [idioma,setIdiomaState]=useState<DashboardLanguage>('pt');
 useEffect(()=>{try{const a=localStorage.getItem('shopyump.appearance');if(a==='claro'||a==='escuro'||a==='sistema')setAppearanceState(a);const l=localStorage.getItem('shopyump.language');if(l==='pt'||l==='en')setIdiomaState(l)}catch{}},[]);
 const setAppearance=(v:string)=>{if(v!=='claro'&&v!=='escuro'&&v!=='sistema')return;setAppearanceState(v);try{localStorage.setItem('shopyump.appearance',v)}catch{}};
 const setIdioma=(v:DashboardLanguage)=>{setIdiomaState(v);try{localStorage.setItem('shopyump.language',v)}catch{}}; const [deviceDark,setDeviceDark]=useState(false);
 const [store,setStore]=useState<StoreData>({nome:demoLoja.nome ?? '',provincia:'',cidade:'',endereco:''});
 const [contacts,setContacts]=useState<Contacts>({whatsapp:demoLoja.whatsapp ?? '',mensagemWhatsapp:'',telefone:'',email:demoLoja.email ?? '',horarioAtivo:false,horario:defaultBusinessHours()});
 const [region,setRegion]=useState<Region>({pais:'MZ',idioma:'pt',moeda:'MZN',fuso:'Africa/Maputo'});
 const [delivery,setDelivery]=useState<Delivery>({domicilio:false,zonas:[],levantamento:false,localLevantamento:'',instrucoesLevantamento:''});
 const [checkout,setCheckout]=useState<Checkout>({whatsapp:Boolean(demoLoja.whatsapp)});
 const [payments,setPayments]=useState<Payments>({transferencia:false,banco:'',titular:'',conta:'',instrucoesTransferencia:'',dinheiroEntrega:false,instrucoesDinheiro:''});
 const [socials,setSocials]=useState<SocialLink[]>(()=>{const base:Record<string,string>={Instagram:'https://instagram.com/',Facebook:'https://facebook.com/',TikTok:'https://tiktok.com/@'};const rows:[string,string|null,boolean|null][]=[['Instagram',demoLoja.instagram,demoLoja.mostrar_instagram],['Facebook',demoLoja.facebook,demoLoja.mostrar_facebook],['TikTok',demoLoja.tiktok,demoLoja.mostrar_tiktok]];return rows.filter(r=>r[1]).map((r,i)=>({id:i+1,nome:r[0],url:/^https?:/.test(r[1]!)?r[1]!:base[r[0]]+r[1]!.replace('@',''),visivel:Boolean(r[2])}))});
 const [pages,setPages]=useState(()=>buildPages(demoLoja));
 const [storeStatus,setStoreStatus]=useState<StoreStatus>({ativa:true,eliminacaoEm:null,ativaAntesEliminacao:true});
 useEffect(()=>{const m=window.matchMedia('(prefers-color-scheme: dark)');setDeviceDark(m.matches);const change=()=>setDeviceDark(m.matches);m.addEventListener('change',change);return()=>m.removeEventListener('change',change)},[]);
 return {notifications,setNotifications,account,setAccount,appearance,setAppearance,idioma,setIdioma,dark:appearance==='escuro'||appearance==='sistema'&&deviceDark,store,setStore,contacts,setContacts,region,setRegion,delivery,setDelivery,checkout,setCheckout,payments,setPayments,socials,setSocials,pages,setPages,storeStatus,setStoreStatus};
}
type DashboardStateValue=ReturnType<typeof useStateValue>;
// Keep one context identity across hot reloads so provider and consumers never diverge.
const g=globalThis as typeof globalThis&{__shopyumpDashboardCtx?:React.Context<DashboardStateValue|null>};
const Context=g.__shopyumpDashboardCtx??=createContext<DashboardStateValue|null>(null);
export function DashboardStateProvider({children,init}:{children:ReactNode;init:DashboardInit}){const value=useStateValue(init);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useDashboardState(){const v=useContext(Context);if(!v)throw new Error('Dashboard state unavailable');return v}
