import React from "react";
import Basket from "@/components/Basket";

export default function PedidoScreen() {
  return <Basket title={"Pedido"} url={"checkout"} help={{
    title: "¿Cómo llenar los campos?",
    image: require("../../../assets/ayudaInicial.png"),
    content: [

      {
        "subtitle": "Actualizar",
        "content": "El botón 'Actualizar' sirve para que, cuando el responsable del area revise el pedido y lo apruebe, acutlizar las cantidades para hacer el movimiento."
      },
      {
        "subtitle": "Lista de productos",
        "content": "Esta es la lista de productos que están asignados a su área (con su unidad de medida y contenido neto) con las cantidades que el responsable de área declaró que necesita, para que confirme en el espacio de la derecha especifique la cantidad que se le puede despachar."
      },
      {
        "subtitle": "Procedimiento",
        "content": "Si alguna cantidad de los productos pedidos por el responsable del área no existe en el almacen se marcará en rojo y no dejara hacer el movimiento, las cantidades que hayan en existencia estarán en verdes indicando que no hay problema, una vez que actualice las cantidades, el pedido debe ser aprobado nuevamente por el responsable de área, una vez que este lo haga toca en actualizar para poder hacer el movimiento."
      },
    ]
  }} />
}

