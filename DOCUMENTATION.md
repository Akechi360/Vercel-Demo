# UroVital App - Estructura de Archivos

Este documento describe la estructura de archivos y directorios del proyecto UroVital.

```
.
├── .env
├── README.md
├── apphosting.yaml
├── components.json
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── src
    ├── ai
    │   ├── dev.ts
    │   └── genkit.ts
    ├── app
    │   ├── (app)
    │   │   ├── administrativo
    │   │   │   ├── alerts
    │   │   │   │   └── page.tsx
    │   │   │   ├── providers
    │   │   │   │   └── page.tsx
    │   │   │   └── supplies
    │   │   │       └── page.tsx
    │   │   ├── afiliaciones
    │   │   │   └── page.tsx
    │   │   ├── appointments
    │   │   │   └── page.tsx
    │   │   ├── companies
    │   │   │   ├── [companyId]
    │   │   │   │   └── page.tsx
    │   │   │   └── page.tsx
    │   │   ├── dashboard
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── finanzas
    │   │   │   ├── pagos
    │   │   │   │   └── page.tsx
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── patients
    │   │   │   ├── [patientId]
    │   │   │   │   ├── layout.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── reports
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── summary
    │   │   │   │   │   └── page.tsx
    │   │   │   │   └── urology
    │   │   │   │       └── page.tsx
    │   │   │   └── page.tsx
    │   │   └── settings
    │   │       ├── layout.tsx
    │   │       ├── preferences
    │   │       │   └── page.tsx
    │   │       ├── profile
    │   │       │   └── page.tsx
    │   │       └── security
    │   │           └── page.tsx
    │   ├── (auth)
    │   │   ├── forgot-password
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── login
    │   │   │   └── page.tsx
    │   │   └── register
    │   │       └── page.tsx
    │   ├── (public)
    │   │   ├── afiliacion
    │   │   │   └── page.tsx
    │   │   ├── directorio
    │   │   │   └── page.tsx
    │   │   ├── estudios
    │   │   │   └── page.tsx
    │   │   ├── landing
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components
    │   ├── admin
    │   │   ├── providers
    │   │   │   ├── add-provider-form.tsx
    │   │   │   ├── provider-list-wrapper.tsx
    │   │   │   └── provider-list.tsx
    │   │   └── supplies
    │   │       ├── add-supply-form.tsx
    │   │       ├── supply-list-wrapper.tsx
    │   │       └── supply-list.tsx
    │   ├── affiliations
    │   │   ├── add-affiliation-dialog.tsx
    │   │   ├── add-affiliation-form.tsx
    │   │   ├── affiliation-actions.tsx
    │   │   └── stat-cards.tsx
    │   ├── appointments
    │   │   ├── add-appointment-fab.tsx
    │   │   ├── add-appointment-form.tsx
    │   │   ├── doctor-appointments.tsx
    │   │   └── patient-appointments.tsx
    │   ├── auth
    │   │   └── auth-form.tsx
    │   ├── companies
    │   │   ├── add-company-form.tsx
    │   │   ├── company-list-wrapper.tsx
    │   │   └── company-list.tsx
    │   ├── dashboard
    │   │   ├── charts.tsx
    │   │   ├── stat-card.tsx
    │   │   └── upcoming-appointments.tsx
    │   ├── finance
    │   │   ├── direct-payments-table.tsx
    │   │   ├── finance-table.tsx
    │   │   └── stat-cards.tsx
    │   ├── history
    │   │   ├── consultation-card.tsx
    │   │   ├── export-history-button.tsx
    │   │   └── medical-history-timeline.tsx
    │   ├── layout
    │   │   ├── app-header.tsx
    │   │   ├── app-layout.tsx
    │   │   ├── auth-provider.tsx
    │   │   ├── footer.tsx
    │   │   └── nav.tsx
    │   ├── patients
    │   │   ├── add-history-fab.tsx
    │   │   ├── add-patient-form.tsx
    │   │   ├── consultation-form.tsx
    │   │   ├── ipss-calculator.tsx
    │   │   ├── lab-results-card.tsx
    │   │   ├── patient-detail-header.tsx
    │   │   ├── patient-detail-nav.tsx
    │   │   ├── patient-list-wrapper.tsx
    │   │   ├── patient-list.tsx
    │   │   ├── patient-summary-cards.tsx
    │   │   ├── patient-summary-client.tsx
    │   │   └── quick-actions.tsx
    │   ├── reports
    │   │   ├── add-report-fab.tsx
    │   │   ├── new-report-form.tsx
    │   │   ├── report-card.tsx
    │   │   ├── report-detail-modal.tsx
    │   │   └── report-list.tsx
    │   ├── shared
    │   │   └── page-header.tsx
    │   ├── theme-provider.tsx
    │   └── ui
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── file-input.tsx
    │       ├── form.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       └── tooltip.tsx
    ├── hooks
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    └── lib
        ├── actions.ts
        ├── data
        │   ├── affiliations.json
        │   ├── appointments.json
        │   ├── companies.json
        │   ├── consultations.json
        │   ├── doctors.json
        │   ├── estudios.json
        │   ├── ipss-values.json
        │   ├── lab-results.json
        │   ├── patients.json
        │   ├── payment-methods.json
        │   ├── payment-types.json
        │   ├── payments.json
        │   ├── prescriptions.json
        │   ├── providers.json
        │   ├── reports.json
        │   ├── supplies.json
        │   └── users.json
        ├── payment-options.ts
        ├── placeholder-images.json
        ├── placeholder-images.ts
        ├── store
        │   ├── appointment-store.ts
        │   ├── company-store.ts
        │   ├── finance-store.ts
        │   ├── patient-store.ts
        │   ├── provider-store.ts
        │   └── supply-store.ts
        ├── types.ts
        └── utils.ts
```