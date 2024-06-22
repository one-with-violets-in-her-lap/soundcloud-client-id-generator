const CLIENT_ID_OCCURRENCES = ['"clientId":"']

export class FailedToGetClientIdError extends Error {
    constructor(explanation: string) {
        super(explanation)
    }
}

/**
 * gets the client id from https://m.soundcloud.com/
 * 
 * @param proxyUrlToPrepend proxy url to add before soundcloud website url
 * to fetch page contents. empty string by default
 * @param fetchSoundcloudPage custom logic to fetch html of soundcloud page from given url
 * with some customization like proxy.
 * **use wisely and return native fetch response object**
 * 
 * @throws {FailedToGetClientIdError}
 */
export async function getSoundcloudClientId(
    proxyUrlToPrepend = '',
    fetchSoundcloudPage?: (url: string) => Promise<Response>
) {
    let response: Response

    if(fetchSoundcloudPage) {
        response = await fetchSoundcloudPage('https://m.soundcloud.com')
    }
    else {
        response = await fetch(proxyUrlToPrepend + 'https://m.soundcloud.com')
    }
    
    if(!response.ok) {
        throw new FailedToGetClientIdError('failed to request soundcloud page for client '
            + `id, error code: ${response.status}`)
    }

    const pageHtml = await response.text()

    for(const occurrence of CLIENT_ID_OCCURRENCES) {
        /*
            searching this json property: `clientId: "CLIENT_ID"`. then removing name of 
            the property (clientId) and syntax garbage (quotes, colon)
        */

        const clientIdOccurrenceStart = pageHtml.indexOf(occurrence)
        if(clientIdOccurrenceStart === -1) {
            continue
        }

        const clientIdStart = clientIdOccurrenceStart + occurrence.length

        return pageHtml.substring(
            clientIdStart, 
            pageHtml.indexOf('\"', clientIdStart)
        )
    }

    throw new FailedToGetClientIdError('client id cant be found')
}
