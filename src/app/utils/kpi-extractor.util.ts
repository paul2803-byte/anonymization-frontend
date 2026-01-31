/**
 * KPI Extraction Utility for JSON-LD Responses
 * Extracts KPI/benchmark values from anonymization service responses
 * Supports multiple KPI objects for different object types
 * Schema pattern: 'http://ns.ownyourdata.eu/ns/soya-context/kpi{{ Object Type }}'
 */

export interface AttributeKpi {
    name: string;
    displayName: string;
    anonymizationType: string;
    nrBucketsUsed: number | null;
}

/** KPI data with object type information for multiple KPI objects */
export interface MultiKpiData {
    objectType: string;
    kAnonymity: number;
    attributes: AttributeKpi[];
}

const KPI_URL_PREFIX = 'http://ns.ownyourdata.eu/ns/soya-context/kpi';

/**
 * Extracts the object type from a KPI @id
 * e.g., 'http://ns.ownyourdata.eu/ns/soya-context/kpiPerson' -> 'Person'
 */
function extractObjectType(kpiId: string): string {
    if (!kpiId || typeof kpiId !== 'string') {
        return 'Unknown';
    }
    // Extract the part after 'kpi' in the URL
    const kpiIndex = kpiId.lastIndexOf('/kpi');
    if (kpiIndex === -1) {
        return 'Unknown';
    }
    const typePart = kpiId.substring(kpiIndex + 4); // +4 to skip '/kpi'
    return typePart || 'Unknown';
}

/**
 * Extracts all KPI data from a JSON-LD response
 * Supports multiple KPI objects for different object types
 * @param response The JSON-LD response object containing @graph array
 * @returns Array of MultiKpiData objects or null if no KPIs found
 */
export function extractAllKpis(response: any): MultiKpiData[] | null {
    if (!response || !response['@graph'] || !Array.isArray(response['@graph'])) {
        return null;
    }

    const graph = response['@graph'];

    // Find all KPI entries - look for @id containing the soya-context KPI pattern
    const kpiEntries = graph.filter((item: any) => {
        const id = item['@id'];
        return id && typeof id === 'string' &&
            id.includes('ns.ownyourdata.eu/ns/soya-context/kpi');
    });

    if (kpiEntries.length === 0) {
        return null;
    }

    const results: MultiKpiData[] = [];

    for (const kpiEntry of kpiEntries) {
        const objectType = extractObjectType(kpiEntry['@id']);

        // Extract k-anonymity value
        const kanonymityObj = kpiEntry['http://ns.ownyourdata.eu/ns/soya-context/kanonymity'];
        let kAnonymity = 0;
        if (kanonymityObj) {
            if (typeof kanonymityObj === 'object' && kanonymityObj['@value']) {
                kAnonymity = parseInt(kanonymityObj['@value'], 10);
            } else if (typeof kanonymityObj === 'number') {
                kAnonymity = kanonymityObj;
            } else if (typeof kanonymityObj === 'string') {
                kAnonymity = parseInt(kanonymityObj, 10);
            }
        }

        // Extract attributes referenced by the KPI entry
        const attributes: AttributeKpi[] = [];
        const hasAttribute = kpiEntry['http://ns.ownyourdata.eu/ns/soya-context/hasAttribute'];

        if (hasAttribute) {
            // Can be single object or array
            const attributeRefs = Array.isArray(hasAttribute) ? hasAttribute : [hasAttribute];

            for (const attrRef of attributeRefs) {
                const attrId = attrRef['@id'] || attrRef;

                // Find the attribute in the graph
                const attrEntry = graph.find((item: any) => item['@id'] === attrId);

                if (attrEntry) {
                    const attribute = extractAttributeKpi(attrEntry, attrId);
                    attributes.push(attribute);
                } else {
                    // Attribute not found in graph, create basic entry
                    attributes.push({
                        name: attrId,
                        displayName: formatAttributeName(attrId),
                        anonymizationType: 'unknown',
                        nrBucketsUsed: null
                    });
                }
            }
        }

        results.push({
            objectType,
            kAnonymity,
            attributes
        });
    }

    return results.length > 0 ? results : null;
}



/**
 * Extracts KPI information from an attribute entry
 */
function extractAttributeKpi(attrEntry: any, attrId: string): AttributeKpi {
    // Extract anonymization type
    let anonymizationType = 'unknown';
    const anonType = attrEntry['http://ns.ownyourdata.eu/ns/soya-context/anonymizationTyp'];
    if (anonType) {
        if (typeof anonType === 'string') {
            anonymizationType = anonType;
        } else if (anonType['@value']) {
            anonymizationType = anonType['@value'];
        }
    }

    // Extract number of buckets used
    let nrBucketsUsed: number | null = null;
    const bucketsObj = attrEntry['http://ns.ownyourdata.eu/ns/soya-context/nrBucketsUsed'];
    if (bucketsObj) {
        if (typeof bucketsObj === 'object' && bucketsObj['@value']) {
            nrBucketsUsed = parseInt(bucketsObj['@value'], 10);
        } else if (typeof bucketsObj === 'number') {
            nrBucketsUsed = bucketsObj;
        } else if (typeof bucketsObj === 'string') {
            nrBucketsUsed = parseInt(bucketsObj, 10);
        }
    }

    return {
        name: attrId,
        displayName: formatAttributeName(attrId),
        anonymizationType,
        nrBucketsUsed
    };
}

/**
 * Formats an attribute ID into a display-friendly name
 * e.g., "oyd:adresse" -> "Adresse"
 */
function formatAttributeName(attrId: string): string {
    // Remove prefix (e.g., "oyd:")
    let name = attrId;
    if (name.includes(':')) {
        name = name.split(':').pop() || name;
    }
    // Remove URL parts if present
    if (name.includes('/')) {
        name = name.split('/').pop() || name;
    }
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Filters out KPI-related entries from the @graph array
 * Returns only the actual data entries
 */
/**
 * Extracts all KPI data from a flat-JSON response
 * Flat-JSON responses have KPI data in a 'kpis' object at the root level
 * Structure: { data: [], kpis: { kpi{{ ObjectType }}: { "k-Anonymity": number, attrName: { anonymization, nrBuckets } } } }
 * Supports multiple KPI objects for different object types
 * @param response The flat-JSON response object containing 'data' array and 'kpis' object
 * @returns Array of MultiKpiData objects or null if no KPIs found
 */
export function extractAllFlatJsonKpis(response: any): MultiKpiData[] | null {
    if (!response || !response.kpis) {
        return null;
    }

    const kpis = response.kpis;
    const kpiKeys = Object.keys(kpis);
    if (kpiKeys.length === 0) {
        return null;
    }

    const results: MultiKpiData[] = [];

    for (const kpiKey of kpiKeys) {
        const kpiEntry = kpis[kpiKey];
        if (!kpiEntry) {
            continue;
        }

        // Extract object type from key (e.g., 'kpiPerson' -> 'Person')
        let objectType = 'Unknown';
        if (kpiKey.startsWith('kpi')) {
            objectType = kpiKey.substring(3) || 'Unknown';
        }

        // Extract k-anonymity value
        let kAnonymity = 0;
        if (kpiEntry['k-Anonymity'] !== undefined) {
            kAnonymity = typeof kpiEntry['k-Anonymity'] === 'number'
                ? kpiEntry['k-Anonymity']
                : parseInt(kpiEntry['k-Anonymity'], 10);
        }

        // Extract attributes - all other properties except k-Anonymity are attribute KPIs
        const attributes: AttributeKpi[] = [];

        for (const key of Object.keys(kpiEntry)) {
            if (key === 'k-Anonymity') {
                continue; // Skip the k-Anonymity key
            }

            const attrData = kpiEntry[key];
            if (attrData && typeof attrData === 'object') {
                const attribute: AttributeKpi = {
                    name: key,
                    displayName: formatAttributeName(key),
                    anonymizationType: attrData.anonymization || attrData.anonymizationType || 'unknown',
                    nrBucketsUsed: attrData.nrBuckets ?? attrData.nrBucketsUsed ?? null
                };
                attributes.push(attribute);
            }
        }

        // Only add if we have meaningful data
        if (kAnonymity !== 0 || attributes.length > 0) {
            results.push({
                objectType,
                kAnonymity,
                attributes
            });
        }
    }

    return results.length > 0 ? results : null;
}



/**
 * Filters out meta/KPI data from flat-JSON response and returns only the data array
 * @param response The flat-JSON response object
 * @returns The data array or the original response if structure is unexpected
 */
export function filterFlatJsonData(response: any): any[] {
    if (response && response.data && Array.isArray(response.data)) {
        return response.data;
    }
    // If response is already an array, return as-is
    if (Array.isArray(response)) {
        return response;
    }
    return response;
}

export function filterDataEntries(response: any): any {
    if (!response || !response['@graph'] || !Array.isArray(response['@graph'])) {
        return response;
    }

    const filteredGraph = response['@graph'].filter((item: any) => {
        const id = item['@id'];
        // Filter out KPI entries (check for soya-context pattern)
        if (id && typeof id === 'string' &&
            id.includes('ns.ownyourdata.eu/ns/soya-context/kpi')) {
            return false;
        }
        // Filter out attribute metadata entries (those with anonymizationTyp or nrBucketsUsed)
        if (item['http://ns.ownyourdata.eu/ns/soya-context/anonymizationTyp'] ||
            item['http://ns.ownyourdata.eu/ns/soya-context/nrBucketsUsed']) {
            return false;
        }
        return true;
    });

    return {
        ...response,
        '@graph': filteredGraph
    };
}
