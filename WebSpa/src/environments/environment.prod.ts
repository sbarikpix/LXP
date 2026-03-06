// export const environment = {
//     production: true,
//     issuer: 'https://chasma-novo-api-dev.azurewebsites.net',
//     redirectUri: 'https://chasma-novo-dev.azurewebsites.net',
//     postLogoutRedirectUri: 'https://chasma-novo-dev.azurewebsites.net/',
//     clientId: 'Angular Client',
//     responseType: 'code',
//     scope: 'openid profile offline_access ChasmaNOVOApiScope',
// };

export const environment = {
    production: false,
    mobile: false,
    issuer: 'https://chasma-novo-api-dev.azurewebsites.net',
    redirectUri: 'https://chasma-novo-dev.azurewebsites.net',
    postLogoutRedirectUri: 'https://chasma-novo-dev.azurewebsites.net/',
    configuration: {
        aiInstrumentaionKey: '',
        chasmaNOVOAPI: "https://chasma-novo-api-dev.azurewebsites.net",
        oidcSettings: {
            authority: "https://chasma-novo-api-dev.azurewebsites.net",
            client_id: "Angular Client",
            redirect_uri: "https://chasma-novo-dev.azurewebsites.net/signin-callback",
            silent_redirect_uri: "https://chasma-novo-dev.azurewebsites.net/assets/oidc/silent-renew.html",
            post_logout_redirect_uri: "https://chasma-novo-dev.azurewebsites.net/signin-callback",
            response_type: "code",
            scope: 'openid profile offline_access ChasmaNOVOApiScope',
        },
    }
};