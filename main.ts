import { parse } from 'node-html-parser'
import fetch from 'node-fetch'

const CLIENT_ID_OCCURRENCES = [ '{client_id:\"', 'client_id: \"', '\"client_id=' ]
const POTENTIAL_NEEDED_URL_START = 'https://a-v2.sndcdn.com/assets/0-'

export class FailedToGetClientIdError extends Error {
    constructor(explanation: string) {
        super(explanation)
    }
}

/**
 * gets the client id from soundcloud js scripts (https://a-v2.sndcdn.com/assets/...)
 * 
 * performs first search in the most likely location, if client id is not found here,
 * searches in other scripts and takes some time
 * 
 * @throws {FailedToGetClientIdError}
 */
export async function getSoundcloudClientId() {
    const response = await fetch('https://soundcloud.com')
    
    if(!response.ok) {
        throw new FailedToGetClientIdError('Failed to parse Soundcloud page, error code :'
            + response.status)
    }

    const document = parse(await response.text())

    const scripts = document.getElementsByTagName('script')

    const potentialNeededScript = scripts.find(script => {
        const src = script.getAttribute('src')

        return src?.startsWith(POTENTIAL_NEEDED_URL_START)
            && src?.endsWith('.js')
    })

    const otherScripts = scripts.filter(script =>
        script.getAttribute('src') !== potentialNeededScript?.getAttribute('src'))
        
    let clientId: string | undefined = undefined
    for(const script of [
        potentialNeededScript,
        ...otherScripts,
    ]) {        
        if(!script) {
            continue
        }

        const scriptSrc = script.getAttribute('src')
        
        if(!scriptSrc) {
            continue
        }

        try {
            clientId = await findClientIdInScript(scriptSrc)
            break
        }
        catch(error) {}
    }

    if(!clientId) {
        throw new FailedToGetClientIdError('client id is not found in any '
            + 'of soundcloud website\'s scripts. client id location has been probably'
            + 'changed. open an issue on github')
    }

    return clientId
}

async function findClientIdInScript(scriptUrl: string) {
    const scriptContentResponse = await fetch(scriptUrl)

    if(!scriptContentResponse.ok) {
        throw new Error('failed to get Soundcloud script content, error code :'
            + scriptContentResponse.status)
    }

    const scriptContent = await scriptContentResponse.text()

    for(const occurrence of CLIENT_ID_OCCURRENCES) {
        /*
            searching this property: client_id:"CLIENT_ID". then removing name of 
            the property (client_id) and syntax garbage (quotes, comma and colon)
        */

        const clientIdOccurrenceStart = scriptContent.indexOf(occurrence)
        if(clientIdOccurrenceStart === -1) {
            throw new Error('failed to find client id')
        }
        const clientIdStart = clientIdOccurrenceStart + occurrence.length

        return scriptContent.substring(
            clientIdStart, 
            scriptContent.indexOf('\"', clientIdStart)
        )
    }

    throw new Error('failed to find client id')
}
