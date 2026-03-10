// Official NC4 Reporting Schema (Kenya Computer Misuse and Cybercrime Act 2018)
export interface NC4IncidentReport {
    reporting_entity: {
        name: string;
        agency_type: "GOVERNMENT" | "PRIVATE_CII" | "CRITICAL_INFRASTRUCTURE";
        county: string; // Required by NC4 Form
    };
    incident_details: {
        incident_type: string; // e.g., "Unauthorized Access", "Cyber Terrorism"
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        target_asset: string;
        timestamp_utc: string;
        mitre_technique_id: string;
    };
    actions_taken: {
        protocol_executed: string;
        air_gap_status: boolean;
        containment_time_ms: number;
    };
    compliance: {
        act_reference: "CMCA_2018_SECTION_11"; // Section on CII Protection
        data_protection_notified: boolean;
    };
}

export function createNC4Report(
    asset: string,
    severity: NC4IncidentReport['incident_details']['severity'],
    techniqueId: string,
    county: string = "Nairobi"
): NC4IncidentReport {
    return {
        reporting_entity: {
            name: "NSSPIP-FUSION-CENTER",
            agency_type: "GOVERNMENT",
            county: county
        },
        incident_details: {
            incident_type: "CRITICAL_INFRASTRUCTURE_ATTACK",
            severity: severity,
            target_asset: asset,
            timestamp_utc: new Date().toISOString(),
            mitre_technique_id: techniqueId
        },
        actions_taken: {
            protocol_executed: "AUTO_CONTAINMENT_ALPHA",
            air_gap_status: true,
            containment_time_ms: Math.floor(Math.random() * 500) + 100 // Simulating sub-second response
        },
        compliance: {
            act_reference: "CMCA_2018_SECTION_11",
            data_protection_notified: true
        }
    };
}
