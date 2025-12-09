import React from "react";
import { CheckoutBasket } from "@/components/CheckOutBasket";

export default function PedidoScreen() {
  return <CheckoutBasket help={{
    title: "Ayuda",
    image: require("../../assets/ayudaInicial.png"),
    content: [
      {
        "subtitle": "Título de la pantalla",
        "content": "El título muestra el nombre del pedido y el área asignada (por ejemplo: 'Pedido – Cocina - Restaurante'). Esto te permite confirmar rápidamente que estás gestionando el pedido correcto antes de revisar o actualizar las cantidades."
      },
      {
        "subtitle": "Estado de sincronización (icono circular)",
        "content": "El indicador de sincronización muestra el estado actual de la comunicación entre tu dispositivo y el servidor mientras actualizas cantidades. • Rueda girando: sincronizando cambios. • Ícono verde: cambios guardados correctamente. • Ícono rojo: error de sincronización."
      },
      {
        "subtitle": "Estado de conexión del servidor (icono de la nube)",
        "content": "El sistema revisa automáticamente cada 5 segundos si usted esta conectado. • Nube verde: conexión activa y estable. • Nube roja: el servidor no responde, pero puedes seguir trabajando. • Rueda girando: el sistema está intentando reconectar. Si la conexión se pierde, recibirás un aviso sin bloquear tu trabajo."
      },
      {
        "subtitle": "Buscar productos",
        "content": "El buscador permite filtrar rápidamente productos por su nombre. Solo escribe parte del nombre y la lista se ajustará al instante. Funciona independientemente de si hay productos marcados o cantidades en exceso."
      },
      {
        "subtitle": "Marcar productos",
        "content": "Puedes tocar la parte izquierda de cualquier producto para marcarlo. El marcado te ayuda a identificar productos importantes, revisar pedidos especiales o separar los artículos que deseas confirmar antes de mover al área. Los productos marcados se resaltan en azul, excepto si tienen exceso en su cantidad, en cuyo caso permanecen rojos para indicar prioridad."
      },
      {
        "subtitle": "Colores de los productos",
        "content": "Cada producto cambia de color según su estado: • Neutro (blanco): cantidad en cero. • Verde: cantidad válida y dentro del stock disponible. • Rojo: la cantidad excede la existencia del almacén. Mientras un producto esté en rojo, no se podrá realizar el movimiento del pedido. • Azul: producto marcado manualmente, útil para identificar elementos clave (no aplica si está en rojo)."
      },
      {
        "subtitle": "Editar cantidades",
        "content": "En la columna derecha puedes introducir la cantidad que el almacén puede despachar para cada producto. La sincronización es automática, por lo que no necesitas guardar manualmente; el sistema mantiene actualizado tu progreso mientras trabajas."
      },
      {
        "subtitle": "Ordenar por cantidades positivas",
        "content": "Aunque la lista se mantiene en su orden original cuando vas editando las cantidades al presionar actualizar se ordenan por cantidad poniendo de primeros los productos a los que le has asignado una cantidad para dar salida."
      },
      {
        "subtitle": "Actualizar información",
        "content": "El botón 'Actualizar' permite refrescar el estado del pedido para rectificarlo o actualizar nombres, cantidades, unidades de medida o contenidos netos que hayan sido modificados en el servidor."
      },
      {
        "subtitle": "Movimiento al área",
        "content": "El botón 'Mover al área' ejecuta el proceso final. Solo estará habilitado si: • No existen productos con cantidades en rojo. • La sincronización con el servidor fue exitosa. Al completarse el movimiento, el sistema archivará el pedido y te llevará de regreso a la pantalla principal."
      },
      {
        "subtitle": "Procedimiento completo",
        "content": "1. Revisa los productos solicitados por el área. 2. Introduce la cantidad disponible en almacén para cada producto. 3. Verifica que ninguna cantidad exceda el stock (color rojo). 4. Si se realizan cambios desde otro dispositivo, en el servidor o para verificar antes de hacer el movimiento toca 'Actualizar'. 5. Una vez aprobado y sin errores, selecciona 'Mover al área'. 6. El movimiento se registrará y el pedido quedará completado."
      },
      {
        "subtitle": "Consejos de uso",
        "content": "• Si un producto aparece repetidamente en rojo, revisa el inventario físico. • Marca productos para mantener un orden personal durante el despacho. • Usa el buscador para acelerar la revisión de áreas con muchos productos. • Si la conexión se pierde, continúa trabajando; al reconectarse, la sincronización se restaurará automáticamente."
      }
    ]
  }} />
}

