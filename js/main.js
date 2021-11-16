
// Variable declarations
const tabla = document.querySelector('.detalle-facturas')
const body_facturas = document.getElementById('body-facturas')
let pagadoCapital = 0
const divFacturas = document.querySelector('#facturas-container')
const formatPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})
const submit = document.querySelector('#submit-pago')
let primerNoPagada,
    customer_name,
    item_name,
    item_id,
    id_Creator,
    idsInvoices,
    consecutivo,
    plazo,
    JSON_Facturas,
    IDProductoCRM,
    IDCampa_a,
    ValorTotalDelProducto,
    MontoGC = 0

let FacturasTabla = Array()

// logica de calculadora, se obtienen datos de CRM(PageLoad)
ZOHO.embeddedApp.on("PageLoad", function (data) {
    // se obtienen datos del trato 
    ZOHO.CRM.API.getRecord({ Entity: data.Entity, RecordID: data.EntityId })
        .then(function (data) {
            // console.log(data.data[0])
            IDProductoCRM = data.data[0].Nombre_de_Producto.id
            IDCampa_a = data.data[0].Campaign_Source.id
            var func_name = "getAllFacturas";
            var req_data = {
                "arguments": JSON.stringify({
                    "customer_name": data.data[0].Contact_Name.name,
                    "item_name": data.data[0].Deal_Name
                })
            }
            // se ejecuta una funcion de CRM 
            ZOHO.CRM.FUNCTIONS.execute(func_name, req_data)
                .then(function (data) {
                    CrearTabla_1(data)

                })
        })
})

function CrearJson(JSON_Facturas) {
    ZOHO.CRM.API.getRecord({ Entity: "Products", RecordID: IDProductoCRM })
        .then(function (dataP) {
            ZOHO.CRM.API.getRecord({ Entity: "Campaigns", RecordID: IDCampa_a })
                .then(function (dataC) {
                    console.log(dataC)
                    let MontoCapital = document.getElementById('pago').value
                    let interesAnual = dataC.data[0].Interes
                    let aforoAux1 = parseFloat(MontoCapital) + parseFloat(MontoGC)
                    let aforoAux = parseFloat(pagadoCapital) + parseFloat(aforoAux1)
                    let MontoTotal = parseFloat( dataP.data[0].Costo_total_del_terreno )
                    let aforo = MontoTotal - aforoAux
                    // console.log(interesAnual + ' - ' + plazo + ' - ' + aforo)
                    let facturas = new DocumentFragment()
                    let ContFacturas
                    let TasaDeInteres = (interesAnual / 12) / 100;
                    let Plazos = plazo - (consecutivo - 1)
                    let Mensualidad = Pago(interesAnual, Plazos, aforo)
                    let saldo = aforo
                    let count
                    
                    console.log('aforoAux: '+aforoAux)
                    console.log('MontoGC: '+MontoGC)
                    console.log('Monto Total: '+MontoTotal)
                    console.log('pagadoCapital: '+pagadoCapital)
                    console.log('interesAnual: '+interesAnual)
                    console.log('Plazos: '+Plazos)
                    console.log('MontoCapital: '+MontoCapital)
                    console.log('Mensualidad: '+Mensualidad)
                    console.log('aforo: '+aforo)
                    console.log('saldo: '+saldo)

                    JSON_Facturas.forEach((factura) => {
                        let FacturaTabla = {}
                        ContFacturas = factura.reference_number.split(" ")
                        if (ContFacturas[0] < consecutivo && !factura.reference_number.includes('GC')) {
                            FacturaTabla.reference_number = factura.reference_number
                            FacturaTabla.Consecutivo = ContFacturas[0]
                            FacturaTabla.date = factura.date
                            FacturaTabla.total = factura.total
                            let Interes = factura.custom_fields.find(
                                (cf) => cf.label === 'Interes'
                            )
                            FacturaTabla.Interes = Interes.value
                            let Capital = factura.custom_fields.find(
                                (cf) => cf.label === 'Capital'
                            )
                            FacturaTabla.Capital = Capital.value
                            FacturaTabla.status = factura.status
                            FacturasTabla.push(FacturaTabla)
                            // console.log('Log-1: '+ContFacturas[0])
                        } else if (ContFacturas[0] >= consecutivo && !factura.reference_number.includes('GC')) {
                            if(ContFacturas[0] == consecutivo){
                                let FacturaCapital = {}
                                FacturaCapital.reference_number = "Pago a capital factura "+ContFacturas[0]
                                FacturaCapital.Consecutivo = ContFacturas[0]
                                FacturaCapital.date = factura.date
                                FacturaCapital.total = MontoCapital
                                FacturaCapital.Interes = "0.00"
                                FacturaCapital.Capital = MontoCapital
                                FacturaCapital.status = "sent"
                                FacturasTabla.push(FacturaCapital)
                            }
                            interes = saldo * TasaDeInteres;
                            Capital = Mensualidad - interes;
                            FacturaTabla.reference_number = factura.reference_number
                            FacturaTabla.Consecutivo = ContFacturas[0]
                            FacturaTabla.date = factura.date
                            FacturaTabla.total = Mensualidad
                            FacturaTabla.Interes = interes
                            FacturaTabla.Capital = Capital
                            FacturaTabla.status = "sent"
                            saldo = saldo - Capital
                            FacturasTabla.push(FacturaTabla)
                            // console.log('Log-2: '+ContFacturas[0])
                        }
                        // console.log(FacturaTabla.json())
                        count += 1
                    })
                    // console.log(FacturasTabla)
                    CrearTabla_2(FacturasTabla)
                })
        })

}

function Pago(interes, plazos, aforo) {
    interes = interes / 100;
    i = interes / 12;
    Monto_interes = aforo * i;
    n2 = 0 - plazos;
    Aux0 = (1 + i)
    Aux = 1 - Math.pow(Aux0, n2)
    aux2 = aforo * i;
    Mensualidad = aux2 / Aux;
    return Mensualidad;
}

function CrearTabla_1(data) {
    const rest = `[${data.details.output}]`
    const dataF = JSON.parse(rest)
    JSON_Facturas = dataF
    // console.log(dataF)
    //-----------------------------------------------------
    // muestra facturas obtenidas
    let facturas = new DocumentFragment()
    dataF.forEach((factura) => {
        // console.log(factura.invoice_id)
        if (!factura.reference_number.includes('GC')) {
            const capital = factura.custom_fields.find(
                (cf) => cf.label === 'Capital'
            )
            const interes = factura.custom_fields.find(
                (cf) => cf.label === 'Interes'
            )
            const divFactura = document.createElement('tr')
            body_facturas.appendChild(divFactura)
            //Fecha
            const spanFecha = document.createElement('td')
            spanFecha.textContent = factura.date
            divFactura.append(spanFecha)
            //Descripcion
            const spanDesc = document.createElement('td')
            spanDesc.textContent = factura.reference_number
            divFactura.classList.add('factura')
            divFactura.setAttribute('data-invoiceid', factura.invoice_id)
            divFactura.append(spanDesc)
            //Cantidad
            const spanPrecio = document.createElement('td')
            spanPrecio.textContent = formatPrice.format(factura.total)
            divFactura.append(spanPrecio)
            //Interes
            const spanInteres = document.createElement('td')
            spanInteres.textContent = factura.total
            spanInteres.textContent = formatPrice.format(
                parseFloat(interes.value)
            )
            divFactura.append(spanInteres)
            //Capital
            const spanCapital = document.createElement('td')
            spanCapital.textContent = factura.total
            spanCapital.textContent = formatPrice.format(
                parseFloat(capital.value)
            )
            divFactura.append(spanCapital)
            //Estado
            const spanEstado = document.createElement('td')
            const divEstatus = document.createElement('div')
            divEstatus.textContent = factura.status
            divFactura.append(spanEstado)
            if (factura.status == 'paid') {
                // Saber cuanto tiene pagado a Capital
                pagadoCapital = pagadoCapital + capital.value
                divEstatus.classList.add('paid')
            } else if (factura.status == 'partially_paid') {
                // Calcular cuando pago parcial tiene y sumarlo
                // P E N D I E N T E
                divEstatus.classList.add('partially-paid')
            } else if (factura.status == 'sent') {
                divEstatus.classList.add('sent')
            }
            spanEstado.append(divEstatus)
        }else if (factura.reference_number.includes('GC')){
            MontoGC = MontoGC + factura.total
            // console.log(factura.total)
            // console.log('MontoGC: '+MontoGC)
        }
    })

    // Obtener primer no pagada
    primerNoPagada = dataF.find(
        (fact) =>
            fact.status == 'sent' && !fact.reference_number.includes('GC')
    )

    // Get Consecutivo actual
    consecutivo = parseInt(primerNoPagada.reference_number.split(' ')[0])
    console.log('Consecutivo: ', consecutivo)

    // Get plazo
    plazo = parseInt(primerNoPagada.reference_number.split(' ')[2])
    console.log('Plazo: ', plazo)

    console.log('Pagado a capital', pagadoCapital)
    // Agregar facturas a html
    divFacturas.append(facturas)
    $('.loader-wrapper').fadeOut('slow')
    //-----------------------------------------------------

}

function CrearTabla_2(data) {
    body_facturas.innerHTML = " "
    //-----------------------------------------------------
    // muestra facturas obtenidas
    let facturas = new DocumentFragment()
    data.forEach((factura) => {
        const capital = factura.Capital
        const interes = factura.Interes
        const divFactura = document.createElement('tr')
        body_facturas.appendChild(divFactura)
        //Fecha
        const spanFecha = document.createElement('td')
        spanFecha.textContent = factura.date
        divFactura.append(spanFecha)
        //Descripcion
        const spanDesc = document.createElement('td')
        spanDesc.textContent = factura.reference_number
        divFactura.classList.add('factura')
        divFactura.append(spanDesc)
        //Cantidad
        const spanPrecio = document.createElement('td')
        spanPrecio.textContent = formatPrice.format(factura.total)
        divFactura.append(spanPrecio)
        //Interes
        const spanInteres = document.createElement('td')
        spanInteres.textContent = factura.total
        spanInteres.textContent = formatPrice.format(
            parseFloat(interes)
        )
        divFactura.append(spanInteres)
        //Capital
        const spanCapital = document.createElement('td')
        spanCapital.textContent = factura.total
        spanCapital.textContent = formatPrice.format(
            parseFloat(capital)
        )
        divFactura.append(spanCapital)
        //Estado
        const spanEstado = document.createElement('td')
        const divEstatus = document.createElement('div')
        divEstatus.textContent = factura.status
        divFactura.append(spanEstado)
        if (factura.status == 'paid') {
            // Saber cuanto tiene pagado a Capital
            // pagadoCapital = pagadoCapital + capital
            divEstatus.classList.add('paid')
        } else if (factura.status == 'partially_paid') {
            // Calcular cuando pago parcial tiene y sumarlo
            // P E N D I E N T E
            divEstatus.classList.add('partially-paid')
        } else if (factura.status == 'sent') {
            divEstatus.classList.add('sent')
        }
        spanEstado.append(divEstatus)
    })
}

// renderisa el widget en pantalla 
ZOHO.embeddedApp.init()
    .then(
        submit.addEventListener('click', (e) => {
            e.preventDefault()
            CrearJson(JSON_Facturas)
        })
    )

