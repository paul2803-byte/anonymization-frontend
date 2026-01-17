
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InfoSection {
    title: string;
    content: string;
    isOpen: boolean;
}

@Component({
    selector: 'app-further-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './further-info.component.html',
    styleUrls: ['./further-info.component.css']
})
export class FurtherInfoComponent {
    sections: InfoSection[] = [
        {
            title: 'Anonymisation Process',
            content: `This anonymisation process ensures GDPR-compliant handling of personal data by applying a configurable, ontology-driven approach. It begins by fetching a JSON-LD configuration from a knowledge graph, which defines the anonymization type and data type for each attribute using SPARQL queries. For every attribute, a matching anonymizer (e.g., masking, generalization, or randomization) is instantiated—depending on available implementations—and applied to the input data after restructuring it by attribute. Generalization, for example, assigns values into buckets to reduce identifiability, while randomization introduces controlled noise, and masking hides values entirely. This modular process ensures flexibility and extensibility, and the entire service is accessible via a documented API. For more details, visit the GitHub repository: <a href="https://github.com/OwnYourData/anonymisation-service" target="_blank" rel="noopener">https://github.com/OwnYourData/anonymisation-service</a>.`,
            isOpen: false
        },
        {
            title: 'What is the Semantic Overlay Architecture (SOyA)?',
            content: `Semantic Overlay Architecture (<a href="https://ownyourdata.github.io/soya/" target="_blank" rel="noopener">SOyA</a>) is a data model authoring and publishing platform and also provides functionalities for validation and transformation. It builds on W3C Resource Description Framework (RDF) and related semantic web technologies to provide a lightweight approach for data integration and exchange. At the core of SOyA is a YAML-based data model for describing data structures with bases and optional overlays, which provide additional information and context.`,
            isOpen: false
        },
        {
            title: 'Provide Feedback',
            content: `This service is a Proof-of-Concept to demonstrate an anonymisation service using the <a href="https://ownyourdata.github.io/soya/#overlay_element" target="_blank" rel="noopener">overlay capabilities of SOyA</a>, i.e., show-case an easy but still machine-readable format to describe datasets and use the built-in mechanisms of SOyA for anonymisation.<br><br>We would like to encourage everyone to <a href="https://github.com/OwnYourData/anonymisation-service/issues" target="_blank" rel="noopener">report issues</a> or even <a href="https://github.com/OwnYourData/anonymisation-service/pulls" target="_blank" rel="noopener">provide pull-requests</a> on the public <a href="https://github.com/OwnYourData/anonymisation-service" target="_blank" rel="noopener">Github repository</a>.`,
            isOpen: false
        },
        {
            title: 'Using the Anonymisation Service API',
            content: `This website is a frontend for the underlying technology of data anonymisation. You can use this service via a REST API by calling the following API endpoint:<br>
        <code>POST https://anonymizer.go-data.at/api/anonymise</code><br>
        provide the data set and a reference to the SOyA structure in the body of a POST request; example:<br>
        <pre>cat input.json | curl -H 'Content-Type: application/json' -d @- -X POST https://anonymizer.go-data.at/api/anonymise</pre>
        data format of input.json:<br>
        <pre>{
  "configurationURL": "https://soya.ownyourdata.eu/AnonymisationDemo",
  "data": [...]
}</pre><br>
        Swagger API of this service is available here: <a href="https://anonymizer.go-data.at/swagger-ui/index.html" target="_blank" rel="noopener">https://anonymizer.go-data.at/swagger-ui/index.html</a><br>
        Docker image for local deployment can be downloaded here: <a href="https://hub.docker.com/r/oydeu/anonymizer" target="_blank" rel="noopener">https://hub.docker.com/r/oydeu/anonymizer</a>`,
            isOpen: false
        },
        {
            title: 'Step-by-Step Guide',
            content: `Follow these steps to anonymise your dataset using the Anonymisation Service:<br>
        <ol>
            <li>Provide your raw data in a cleaned, well-structured format — either by uploading a file or pasting it into the input field. → See example: <a href="https://anonymiser.ownyourdata.eu/data.json" target="_blank" rel="noopener">data.json</a></li>
            <li>Create a SOyA structure that defines your dataset and how it should be anonymised:
                <ul>
                    <li>Use the public SOyA repository to create a new structure: <a href="https://soya.ownyourdata.eu" target="_blank" rel="noopener">https://soya.ownyourdata.eu</a></li>
                    <li>First, describe the data structure in the bases section by following <a href="https://github.com/OwnYourData/soya/blob/main/tutorial/README.md#meta-and-bases-section" target="_blank" rel="noopener">this tutorial</a> (note: make sure to provide a definition for min/max values when using <code>generalization</code>)</li>
                    <li>Then, define an OverlayClassification (see the <a href="https://github.com/OwnYourData/soya/blob/main/tutorial/README.md#classification" target="_blank" rel="noopener">Classification section</a> in the tutorial) to specify the anonymisation methods for each attribute.</li>
                </ul>
            </li>
            <li>Enter the name of your SOyA structure into the Model field.</li>
            <li>Click "Anonymise" to process your dataset.</li>
        </ol>`,
            isOpen: false
        }
    ];

    toggleSection(index: number): void {
        this.sections[index].isOpen = !this.sections[index].isOpen;
    }
}
