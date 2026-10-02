
// basit sandbox

const SF_DOMAIN =
    "https://masternaut--basit.sandbox.my.salesforce.com";

const CLIENT_ID =
    "3MVG97IVyarqycDnBbiu2NuL9tEGfJiQELfkJwnWmdPANPE.l6hNR9Zv68XNJl0qj1vbavS8p7oS99cCYyIZx";

const ALLOWED_ORIGIN =
    "https://basitali-coder.github.io";

const LIGHTNING_OUT_APP_ID =
    "1Usbh00000000o1CAA";


function corsHeaders() {

    return {
        "Access-Control-Allow-Origin":
            ALLOWED_ORIGIN,

        "Access-Control-Allow-Methods":
            "POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type",

        "Vary":
            "Origin"
    };

}


function jsonResponse(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                "Content-Type":
                    "application/json",

                ...corsHeaders()
            }
        }
    );

}


export default {

    async fetch(request) {

        /*
         * CORS preflight
         */

        if (request.method === "OPTIONS") {

            return new Response(
                null,
                {
                    status: 204,
                    headers:
                        corsHeaders()
                }
            );

        }


        /*
         * Only POST
         */

        if (request.method !== "POST") {

            return jsonResponse(
                {
                    error:
                        "Only POST allowed"
                },
                405
            );

        }


        try {

            const url =
                new URL(request.url);

            /*
             * Remove leading/trailing /
             *
             * Examples:
             *
             * /token      -> token
             * /token/     -> token
             * /frontdoor  -> frontdoor
             */

            const path =
                url.pathname
                    .replace(/^\/+|\/+$/g, "");


            const body =
                await request.json();


            /*
             * =====================================================
             * TOKEN
             * =====================================================
             */

            if (path === "token") {

                const code =
                    body.code;

                const codeVerifier =
                    body.code_verifier;

                const redirectUri =
                    body.redirect_uri;


                if (!code) {

                    return jsonResponse(
                        {
                            error:
                                "missing code"
                        },
                        400
                    );

                }


                if (!codeVerifier) {

                    return jsonResponse(
                        {
                            error:
                                "missing code_verifier"
                        },
                        400
                    );

                }


                if (!redirectUri) {

                    return jsonResponse(
                        {
                            error:
                                "missing redirect_uri"
                        },
                        400
                    );

                }


                /*
                 * Server-side Salesforce OAuth exchange
                 */

                const salesforceResponse =
                    await fetch(

                        SF_DOMAIN +
                        "/services/oauth2/token",

                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/x-www-form-urlencoded"

                            },

                            body:
                                new URLSearchParams({

                                    grant_type:
                                        "authorization_code",

                                    client_id:
                                        CLIENT_ID,

                                    code:
                                        code,

                                    redirect_uri:
                                        redirectUri,

                                    code_verifier:
                                        codeVerifier

                                })

                        }

                    );


                const result =
                    await salesforceResponse.text();


                return new Response(
                    result,
                    {

                        status:
                            salesforceResponse.status,

                        headers: {

                            "Content-Type":
                                "application/json",

                            ...corsHeaders()

                        }

                    }
                );

            }


            /*
             * =====================================================
             * FRONTDOOR
             * =====================================================
             */

            if (path === "frontdoor") {

                const accessToken =
                    body.access_token;


                if (!accessToken) {

                    return jsonResponse(
                        {
                            error:
                                "missing access_token"
                        },
                        400
                    );

                }


                const salesforceResponse =
                    await fetch(

                        SF_DOMAIN +
                        "/services/oauth2/lightningoutsingleaccess",

                        {

                            method:
                                "POST",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    accessToken,

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    appId:
                                        LIGHTNING_OUT_APP_ID

                                })

                        }

                    );


                const result =
                    await salesforceResponse.text();


                return new Response(
                    result,
                    {

                        status:
                            salesforceResponse.status,

                        headers: {

                            "Content-Type":
                                "application/json",

                            ...corsHeaders()

                        }

                    }
                );

            }


            /*
             * =====================================================
             * ELSE NO FRONTDOOR URI 
             * =====================================================
             */

            return jsonResponse(
                {
                    error:
                        "Unknown endpoint",

                    receivedPath:
                        url.pathname,

                    normalisedPath:
                        path,

                    hint:
                        "Expected /token or /frontdoor"
                },
                404
            );


        }
        catch (error) {

            return jsonResponse(
                {
                    error:
                        error.message
                },
                500
            );

        }

    }

};
