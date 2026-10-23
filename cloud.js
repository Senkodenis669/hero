/* Дневник героя — облако на Supabase (window.HD_CLOUD). Вход по коду из письма, синхронизация через REST. Plain JS, no deps. */
(function(){
"use strict";
var URL_="https://fbzyqnyorfbtkufgnmym.supabase.co";
var KEY="sb_publishable_FrQlEby7DX9hXM78SHJHYA_nm7xfh9U"; // публичный ключ, доступ к данным закрыт правилами RLS
var SKEY="hero-diary.session";
var session=null;
try{session=JSON.parse(localStorage.getItem(SKEY)||"null")}catch(e){}

function save(s){session=s;try{if(s)localStorage.setItem(SKEY,JSON.stringify(s));else localStorage.removeItem(SKEY)}catch(e){}}
function err(code,msg){var e=new Error(msg||code);e.code=code;return e}
async function call(path,opt){opt=opt||{};
  var h={apikey:KEY,"Content-Type":"application/json"};
  if(opt.auth!==false&&session)h.Authorization="Bearer "+session.access_token;
  if(opt.prefer)h.Prefer=opt.prefer;
  var res;try{res=await fetch(URL_+path,{method:opt.method||"GET",headers:h,body:opt.body?JSON.stringify(opt.body):undefined})}
  catch(e){throw err("unavailable","Нет связи с сервером")}
  var txt=await res.text(),data=null;try{data=txt?JSON.parse(txt):null}catch(e){}
  if(!res.ok){var m=(data&&(data.msg||data.message||data.error_description||data.error))||("HTTP "+res.status);
    throw err(res.status===401||res.status===403?"auth":res.status>=500||res.status===429?"unavailable":"invalid_argument",m)}
  return data}
function keep(d){if(!d||!d.access_token)throw err("auth","Сервер не вернул сессию");
  save({access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()+((d.expires_in||3600)-60)*1000,user:{id:d.user&&d.user.id,email:d.user&&d.user.email}})}
var refreshing=null;
async function fresh(){if(!session)throw err("auth","Не выполнен вход");
  if(Date.now()<session.expires_at)return;
  if(!refreshing)refreshing=call("/auth/v1/token?grant_type=refresh_token",{method:"POST",auth:false,body:{refresh_token:session.refresh_token}})
    .then(keep).catch(function(e){if(e.code==="auth"||e.code==="invalid_argument")save(null);throw e}).finally(function(){refreshing=null});
  return refreshing}
async function rest(path,opt){await fresh();try{return await call(path,opt)}
  catch(e){if(e.code!=="auth")throw e;session.expires_at=0;await fresh();return call(path,opt)}}

/* same shape as the Claude db the diary already speaks: collection(base).limit(n).get(), collection(base).doc(id).set()/delete() */
function row(id,data){return {user_id:session.user.id,id:id,data:data}} // updated_at is set by the database
var db={collection:function(){return{
  limit:function(){return{get:async function(){
    var rows=await rest("/rest/v1/docs?select=id,data,updated_at&data=not.is.null&limit=5000");
    var since="";rows.forEach(function(r){if(r.updated_at>since)since=r.updated_at});
    return {empty:!rows.length,since:since,docs:rows.map(function(r){return{id:r.id,exists:true,data:function(){return r.data}}})}}}},
  doc:function(id){return{
    set:function(data){return rest("/rest/v1/docs?on_conflict=user_id,id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:row(id,data)})},
    delete:function(){return rest("/rest/v1/docs?on_conflict=user_id,id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:row(id,null)})}}}}}};

window.HD_CLOUD={
  db:db,
  user:function(){return session&&session.user||null},
  sendCode:function(email){return call("/auth/v1/otp",{method:"POST",auth:false,body:{email:email,create_user:true}})},
  verify:async function(email,code){keep(await call("/auth/v1/verify",{method:"POST",auth:false,body:{type:"email",email:email,token:code}}))},
  signOut:function(){save(null)},
  /* rows changed by other devices since `since` (ISO string); data:null means deleted */
  changes:async function(since){var q="/rest/v1/docs?select=id,data,updated_at&order=updated_at.asc&limit=5000"+(since?"&updated_at=gt."+encodeURIComponent(since):"");return rest(q)},
  ping:function(){return rest("/rest/v1/docs?select=id&limit=1")}
};
})();
