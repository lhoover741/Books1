function json(d,s=200){
  return new Response(JSON.stringify(d),{status:s});
}

function decode(t){
  try{
    const [e,id,time]=atob(t).split(':');
    return {e,id:+id,time:+time};
  }catch{return null;}
}

export async function onRequestPost({request}){
  const {email,token,lead_id}=await request.json();

  const d=decode(token);
  if(!d) return json({ok:false},401);

  if(Date.now()-d.time>86400000)
    return json({ok:false,error:'Session expired'},401);

  if(d.e!==email || d.id!=lead_id)
    return json({ok:false},401);

  return json({ok:true});
}