/**
 * KPI Extraction Utility for JSON-LD Responses
 * Extracts KPI/benchmark values from anonymization service responses
 */

export interface AttributeKpi {
    name: string;
    displayName: string;
    anonymizationType: string;
    nrBucketsUsed: number | null;
}

export interface KpiData {
    kAnonymity: number;
    attributes: AttributeKpi[];
}

/**
 * Extracts KPI data from a JSON-LD response
 * @param response The JSON-LD response object containing @graph array
 * @returns KpiData object or null if no KPIs found
 */
export function extractKpis(response: any): KpiData | null {
    if (!response || !response['@graph'] || !Array.isArray(response['@graph'])) {
        return null;
    }

    const graph = response['@graph'];

    // Find KPI entry - look for @id containing the soya-context KPI pattern
    const kpiEntry = graph.find((item: any) => {
        const id = item['@id'];
        return id && typeof id === 'string' &&
            id.includes('ns.ownyourdata.eu/ns/soya-context/kpi');
    });

    if (!kpiEntry) {
        return null;
    }

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

    return {
        kAnonymity,
        attributes
    };
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
 * Extracts KPI data from a flat-JSON response
 * Flat-JSON responses have KPI data in a 'kpis' object at the root level
 * Structure: { data: [], kpis: { kpiName: { "k-Anonymity": number, attrName: { anonymization, nrBuckets } } } }
 * @param response The flat-JSON response object containing 'data' array and 'kpis' object
 * @returns KpiData object or null if no KPIs found
 */
export function extractFlatJsonKpis(response: any): KpiData | null {
    if (!response || !response.kpis) {
        return null;
    }

    const kpis = response.kpis;

    // Get the first KPI entry (e.g., kpiAnonymisationDemo)
    const kpiKeys = Object.keys(kpis);
    if (kpiKeys.length === 0) {
        return null;
    }

    const kpiEntry = kpis[kpiKeys[0]];
    if (!kpiEntry) {
        return null;
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

    // If no kAnonymity and no attributes found, return null
    if (kAnonymity === 0 && attributes.length === 0) {
        return null;
    }

    return {
        kAnonymity,
        attributes
    };
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
