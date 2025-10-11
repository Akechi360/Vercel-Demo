
export const AFFILIATE_PLANS = [
    {
        id: 'tarjeta-saludable',
        name: "Tarjeta Saludable",
        subtitle: "Individual + 2 Beneficiarios",
        affiliationFee: 50,
        paymentModes: {
            contado: {
                price: 150,
            },
            credito: {
                installmentOptions: [
                    { type: 'cuotas', count: 3, amount: 50 },
                    { type: 'mensual', count: 12, amount: 10 }
                ]
            }
        }
    },
    {
        id: 'fondo-espiritu-santo',
        name: "Fondo Espíritu Santo",
        subtitle: "Grupos de 200–500 afiliados",
        affiliationFee: 0,
        coverageBenefit: "Garantiza una cobertura del 15% del monto total.",
        paymentModes: {
            contado: {
                price: 250,
            },
            credito: {
                installmentOptions: [
                    { type: 'cuotas', count: 4, amount: 62.50 }
                ]
            }
        }
    },
];

// TODO: Fill with real account info and add logos to /public/payments/
export const PAYMENT_METHODS = [
    {
        id: 'banvenez',
        label: 'Banco de Venezuela',
        description: 'Pago Móvil o Transferencia',
        accountInfo: 'Cta.: Corriente\nN°: 0102-0310-4800-0010-8397\nN°: 0102-0740-1500-0046-2143\nC.I.: V-7.108.055\nTelf.: 0424-4303262\nBeneficiario: Juan Carlos Rodríguez Ramírez\nMail: juanrodriguezram57@gmail.com',
        logoSrc: '/images/banks/bdv.png',
    },
    {
        id: 'mercantil',
        label: 'Banco Mercantil',
        description: 'Transferencia Bancaria',
        accountInfo: 'Cta.: Corriente\nN°: 0105-0041-9410-4131-6186\nC.I.: V-7.108.055\nBeneficiario: Juan Carlos Rodríguez Ramírez\nMail: juanrodriguezram57@gmail.com',
        logoSrc: '/images/banks/mercantil.png',
    },
    {
        id: 'bnc',
        label: 'Banco Nacional de Crédito (BNC)',
        description: 'Transferencia Bancaria',
        accountInfo: 'Cta.: Corriente\nN°: 0191-0215-7621-0000-6522\nC.I.: V-7.108.055\nTelf.: 0424-4303262\nBeneficiario: Juan Carlos Rodríguez Ramírez\nMail: juanrodriguezram57@gmail.com',
        logoSrc: '/images/banks/bnc.png',
    },
    {
        id: 'banesco',
        label: 'Banesco',
        description: 'Transferencia Bancaria',
        accountInfo: 'Cta.: Corriente\nN°: 0134-0187-0218-7103-2293\nC.I.: V-7.108.055\nTelf.: 0424-4303262\nBeneficiario: Juan Carlos Rodríguez Ramírez\nMail: juanrodriguezram57@gmail.com',
        logoSrc: '/images/banks/banesco.png',
    },
    {
        id: 'usdt',
        label: 'USDT (Binance)',
        description: 'Pago con Criptomonedas',
        accountInfo: 'User: User-3cbba\nBinance ID: 111542157',
        logoSrc: '/images/banks/binance.png',
    },
    {
        id: 'wallytech',
        label: 'Wally Tech',
        description: 'Pasarela de Pago',
        accountInfo: 'Alias: urovital',
        logoSrc: '/images/banks/wally.png',
    },
    {
        id: 'zinlli',
        label: 'Zinli',
        description: 'Billetera Digital',
        accountInfo: 'Email: pagos@urovital.com',
        logoSrc: '/images/banks/zinli.png',
    },
    {
        id: 'paypal',
        label: 'PayPal',
        description: 'Pagos Internacionales',
        accountInfo: 'Usuario: @juanrodriguez1472',
        logoSrc: '/images/banks/paypal.png',
    }
];
