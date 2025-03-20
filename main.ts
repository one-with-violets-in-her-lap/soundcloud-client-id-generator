import fetch from 'node-fetch'


const CLIENT_ID_OCCURRENCES = ['"clientId":"']

export class FailedToGetClientIdError extends Error {
    constructor(explanation: string) {
        super(explanation)
    }
}

/**
 * gets the client id from https://m.soundcloud.com/
 * 
 * @throws {FailedToGetClientIdError}
 */
export async function getSoundcloudClientId() {
    const response = await fetch('https://m.soundcloud.com')

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
