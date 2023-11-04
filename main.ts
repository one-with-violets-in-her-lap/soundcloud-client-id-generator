import { parse } from 'node-html-parser'

const CLIENT_ID_OCCURRENCE = ',client_id:\"'

export async function getSoundcloudClientId() {
    const response = await fetch('https://soundcloud.com')
    
    if(!response.ok) {
        throw new Error('Failed to parse Soundcloud page, error code :' + response.status)
    }

    const document = parse(await response.text())

    const scriptWithClientId = document.getElementsByTagName('script').find(script => {
        const src = script.getAttribute('src')

        return src?.startsWith('https://a-v2.sndcdn.com/assets/50-')
            && src?.endsWith('.js')
    })?.getAttribute('src')

    if(!scriptWithClientId) {
        throw new Error('Couldn\'t find client id in Soundcloud scripts')
    }

    const scriptContentResponse = await fetch(scriptWithClientId)

    if(!scriptContentResponse.ok) {
        throw new Error('Failed to get Soundcloud script content, error code :' + response.status)
    }

    const scriptContent = await scriptContentResponse.text()

    /*
        searching this property: client_id:"CLIENT_ID". then removing name of 
        the property (client_id) and syntax garbage (quotes, comma and colon)
    */
    const clientIdStart = scriptContent.indexOf(CLIENT_ID_OCCURRENCE) + CLIENT_ID_OCCURRENCE.length

    return scriptContent.substring(
        clientIdStart, 
        scriptContent.indexOf('\"', clientIdStart)
    );
}