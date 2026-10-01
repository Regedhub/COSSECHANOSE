# Servidor de salas de Cosecha Salvaje v16

El proyecto incluye un Relay WebSocket propio. No se ha publicado un servicio
de Internet ni se requieren claves de Unity Gaming Services. El anfitrión sigue
simulando el mundo; el servidor asigna códigos y transporta mensajes entre hasta
cuatro granjeros. El cierre del anfitrión cierra la sala; no hay migración de host.

## Ejecutar

Instala Node.js 20 o posterior. En esta carpeta ejecuta:

```sh
npm install
npm start
npm test
```

El puerto predeterminado es 8080. `PORT` cambia el puerto y `MAX_ROOMS` limita
el número de salas (500 de forma predeterminada). HTTP `/` sirve una comprobación
de salud; WebSocket `/room` transporta el juego. No coloques `/room` en la URL
configurada en el cliente: el juego lo añade.

## Internet

Necesitas alojar este proceso Node en un servidor que acepte conexiones
WebSocket persistentes y poner HTTPS/WSS delante mediante el proxy del proveedor
o un proxy con certificado TLS. Ejemplo de configuración Caddy, sustituyendo
el dominio por uno tuyo:

```text
relay.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Configura `wss://relay.example.com` en Cooperativo > Ajustes online en cada
instalación. También puedes crear `Assets/CosechaSalvaje/Resources/OnlineConfig.txt`
con esa URL como único contenido antes de compilar; las instalaciones compartirán
ese servidor sin introducirlo manualmente. Los jugadores eligen INTERNET y solo
comparten el código de seis números. La URL pertenece al servicio, no al anfitrión.

## Misma red Wi-Fi

La opción MISMA RED WI-FI funciona sin este servidor. Usa búsqueda UDP 27845
y el transporte TCP 27844 del anfitrión. Requiere que el router permita comunicación
entre dispositivos y broadcast; una red de invitados con aislamiento puede bloquearla.
Permite el juego en el firewall de la red privada al probarlo. Android, PC y
el servidor no han sido probados juntos en dispositivos diferentes.

## Chat

T abre el chat; P es pulsar para hablar. La voz se activa expresamente en el menú
de chat y solicita permiso de micrófono. Hay límites de longitud, frecuencia y
colas; se puede silenciar cada participante. La voz usa PCM mono a 16 kHz,
100 ms por mensaje, por el mismo transporte: es una integración sencilla,
sin cancelación de eco, codec de voz ni canal UDP dedicado. Usa auriculares.

Se probaron el Relay y el cliente C# en loopback, incluidos mensajes que contienen
datos de voz. Esto no comprueba la captura ni reproducción de audio en Unity.

Fuentes de las API: [ClientWebSocket](https://learn.microsoft.com/en-us/dotnet/api/system.net.websockets.clientwebsocket)
y [ws](https://github.com/websockets/ws).
