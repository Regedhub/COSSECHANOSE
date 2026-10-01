import http from 'node:http';
import { randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { pathToFileURL } from 'node:url';
export function createRelay() {
 const rooms=new Map();
 const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/plain'});res.end('Cosecha Salvaje Relay v16\n');});
 const wss=new WebSocketServer({noServer:true,maxPayload:262160,perMessageDeflate:false});
 const send=(socket,peer,text)=>{if(socket.readyState===WebSocket.OPEN){if(socket.bufferedAmount>1048576)socket.close(1013,'slow client');else socket.send(`${peer}\n${text}`);}};
 server.on('upgrade',(req,socket,head)=>{
  const url=new URL(req.url,'http://localhost');if(url.pathname!='/room'){socket.destroy();return;}
  const host=url.searchParams.get('host')==='1';let code=url.searchParams.get('code')||'';let room;
  if(host){if(rooms.size>=Number(process.env.MAX_ROOMS||500)){socket.destroy();return;}do{code=String(randomInt(100000,1000000));}while(rooms.has(code));}
  else{room=rooms.get(code);if(!room||room.clients.size>=3){socket.destroy();return;}}
  wss.handleUpgrade(req,socket,head,ws=>{
   if(host){room={host:ws,clients:new Map(),next:1};rooms.set(code,room);send(ws,0,`@room:${code}`);}
   const id=host?0:room.next++;if(!host){room.clients.set(id,ws);send(ws,0,'@connected');}
   ws.alive=true;ws.on('pong',()=>ws.alive=true);
   let windowStart=Date.now(),messages=0,bytes=0;
   ws.on('message',(data,binary)=>{
    if(binary){ws.close(1003);return;}const now=Date.now();if(now-windowStart>=1000){windowStart=now;messages=bytes=0;}bytes+=data.length;if(++messages>100||bytes>1048576){ws.close(1008,'rate limit');return;}
    const frame=data.toString();const split=frame.indexOf('\n');const dest=Number(frame.slice(0,split));if(split<1||!Number.isInteger(dest)){ws.close(1008);return;}
    const payload=frame.slice(split+1);if(payload.startsWith('@')){ws.close(1008);return;} // transport events are server-owned
    if(host){if(dest===-1)for(const peer of room.clients.values())send(peer,0,payload);else{const peer=room.clients.get(dest);if(peer)send(peer,0,payload);}}
    else{if(dest!==0){ws.close(1008);return;}send(room.host,id,payload);}
   });
   ws.on('error',()=>{});
   ws.on('close',()=>{if(host){rooms.delete(code);for(const client of room.clients.values()){send(client,0,'@closed');client.close();}}else{room.clients.delete(id);send(room.host,id,'@closed');}});
  });
 });
 const timer=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},15000);timer.unref();
 return {server,rooms,close:async()=>{clearInterval(timer);for(const ws of wss.clients)ws.terminate();wss.close();await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const relay=createRelay();relay.server.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('Relay listening on',relay.server.address().port));}
