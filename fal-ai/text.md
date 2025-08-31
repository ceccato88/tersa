About
Run any large language model with fal, powered by OpenRouter. This endpoint only supports models that do not train on private data. Read more in OpenRouter's Privacy and Logging documentation.

1. Calling the API
#
Install the client
#
The client provides a convenient way to interact with the model API.

npmyarnpnpmbun

npm install --save @fal-ai/client
Migrate to @fal-ai/client
The @fal-ai/serverless-client package has been deprecated in favor of @fal-ai/client. Please check the migration guide for more information.

Setup your API Key
#
Set FAL_KEY as an environment variable in your runtime.


export FAL_KEY="YOUR_API_KEY"
Submit a request
#
The client API handles the API submit protocol. It will handle the request status updates and return the result when the request is completed.


import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/any-llm/enterprise", {
  input: {
    prompt: "What is the meaning of life?"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
2. Authentication
#
The API uses an API Key for authentication. It is recommended you set the FAL_KEY environment variable in your runtime when possible.

API Key
#
In case your app is running in an environment where you cannot set environment variables, you can set the API Key manually as a client configuration.

import { fal } from "@fal-ai/client";

fal.config({
  credentials: "YOUR_FAL_KEY"
});
Protect your API Key
When running code on the client-side (e.g. in a browser, mobile app or GUI applications), make sure to not expose your FAL_KEY. Instead, use a server-side proxy to make requests to the API. For more information, check out our server-side integration guide.

3. Queue
#
Long-running requests
For long-running requests, such as training jobs or models with slower inference times, it is recommended to check the Queue status and rely on Webhooks instead of blocking while waiting for the result.

Submit a request
#
The client API provides a convenient way to submit requests to the model.


import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/any-llm/enterprise", {
  input: {
    prompt: "What is the meaning of life?"
  },
  webhookUrl: "https://optional.webhook.url/for/results",
});
Fetch request status
#
You can fetch the status of a request to check if it is completed or still in progress.


import { fal } from "@fal-ai/client";

const status = await fal.queue.status("fal-ai/any-llm/enterprise", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  logs: true,
});
Get the result
#
Once the request is completed, you can fetch the result. See the Output Schema for the expected result format.


import { fal } from "@fal-ai/client";

const result = await fal.queue.result("fal-ai/any-llm/enterprise", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
});
console.log(result.data);
console.log(result.requestId);
4. Files
#
Some attributes in the API accept file URLs as input. Whenever that's the case you can pass your own URL or a Base64 data URI.

Data URI (base64)
#
You can pass a Base64 data URI as a file input. The API will handle the file decoding for you. Keep in mind that for large files, this alternative although convenient can impact the request performance.

Hosted files (URL)
#
You can also pass your own URLs as long as they are publicly accessible. Be aware that some hosts might block cross-site requests, rate-limit, or consider the request as a bot.

Uploading files
#
We provide a convenient file storage that allows you to upload files and use them in your requests. You can upload files using the client API and use the returned URL in your requests.


import { fal } from "@fal-ai/client";

const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
const url = await fal.storage.upload(file);
Auto uploads
The client will auto-upload the file for you if you pass a binary object (e.g. File, Data).

Read more about file handling in our file upload guide.

5. Schema
#
Input
#
prompt string
Prompt to be used for the chat completion

system_prompt string
System prompt to provide context or instructions to the model

reasoning boolean
Should reasoning be the part of the final answer.

priority PriorityEnum
Throughput is the default and is recommended for most use cases. Latency is recommended for use cases where low latency is important. Default value: "latency"

Possible enum values: throughput, latency

model ModelEnum
Name of the model to use. Premium models are charged at 10x the rate of standard models, they include: anthropic/claude-3.7-sonnet, meta-llama/llama-3.2-90b-vision-instruct, openai/gpt-5-chat, anthropic/claude-3.5-sonnet, anthropic/claude-3-5-haiku, google/gemini-pro-1.5, openai/gpt-4.1, openai/gpt-4o, openai/o3. Default value: "google/gemini-flash-1.5"

Possible enum values: anthropic/claude-3.7-sonnet, anthropic/claude-3.5-sonnet, anthropic/claude-3-5-haiku, anthropic/claude-3-haiku, google/gemini-pro-1.5, google/gemini-flash-1.5, google/gemini-flash-1.5-8b, google/gemini-2.0-flash-001, meta-llama/llama-3.2-1b-instruct, meta-llama/llama-3.2-3b-instruct, meta-llama/llama-3.1-8b-instruct, meta-llama/llama-3.1-70b-instruct, openai/gpt-oss-120b, openai/gpt-4o-mini, openai/gpt-4o, openai/gpt-4.1, openai/o3, openai/gpt-5-chat, openai/gpt-5-mini, openai/gpt-5-nano, meta-llama/llama-4-maverick, meta-llama/llama-4-scout


{
  "prompt": "What is the meaning of life?",
  "priority": "latency",
  "model": "google/gemini-2.0-flash-001"
}
Output
#
output string
Generated output

reasoning string
Generated reasoning for the final answer

partial boolean
Whether the output is partial

error string
Error message if an error occurred


{
  "output": "The meaning of life is subjective and depends on individual perspectives."
}
Other types
#
Related Models

# any-llm Enterprise

> Run any large language model with fal, powered by OpenRouter.

This endpoint only supports models that do not train on private data.

Read more in OpenRouter's Privacy and Logging documentation.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/any-llm/enterprise`
- **Model ID**: `fal-ai/any-llm/enterprise`
- **Category**: llm
- **Kind**: inference
**Tags**: chat, claude, gpt



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  Prompt to be used for the chat completion
  - Examples: "What is the meaning of life?"

- **`system_prompt`** (`string`, _optional_):
  System prompt to provide context or instructions to the model

- **`reasoning`** (`boolean`, _optional_):
  Should reasoning be the part of the final answer.
  - Default: `false`

- **`priority`** (`PriorityEnum`, _optional_):
  Throughput is the default and is recommended for most use cases. Latency is recommended for use cases where low latency is important. Default value: `"latency"`
  - Default: `"latency"`
  - Options: `"throughput"`, `"latency"`

- **`model`** (`ModelEnum`, _optional_):
  Name of the model to use. Premium models are charged at 10x the rate of standard models, they include: anthropic/claude-3.7-sonnet, meta-llama/llama-3.2-90b-vision-instruct, openai/gpt-5-chat, anthropic/claude-3.5-sonnet, anthropic/claude-3-5-haiku, google/gemini-pro-1.5, openai/gpt-4.1, openai/gpt-4o, openai/o3. Default value: `"google/gemini-flash-1.5"`
  - Default: `"google/gemini-flash-1.5"`
  - Options: `"anthropic/claude-3.7-sonnet"`, `"anthropic/claude-3.5-sonnet"`, `"anthropic/claude-3-5-haiku"`, `"anthropic/claude-3-haiku"`, `"google/gemini-pro-1.5"`, `"google/gemini-flash-1.5"`, `"google/gemini-flash-1.5-8b"`, `"google/gemini-2.0-flash-001"`, `"meta-llama/llama-3.2-1b-instruct"`, `"meta-llama/llama-3.2-3b-instruct"`, `"meta-llama/llama-3.1-8b-instruct"`, `"meta-llama/llama-3.1-70b-instruct"`, `"openai/gpt-oss-120b"`, `"openai/gpt-4o-mini"`, `"openai/gpt-4o"`, `"openai/gpt-4.1"`, `"openai/o3"`, `"openai/gpt-5-chat"`, `"openai/gpt-5-mini"`, `"openai/gpt-5-nano"`, `"meta-llama/llama-4-maverick"`, `"meta-llama/llama-4-scout"`
  - Examples: "google/gemini-2.0-flash-001"



**Required Parameters Example**:

```json
{
  "prompt": "What is the meaning of life?"
}
```

**Full Example**:

```json
{
  "prompt": "What is the meaning of life?",
  "priority": "latency",
  "model": "google/gemini-2.0-flash-001"
}
```


### Output Schema

The API returns the following output format:

- **`output`** (`string`, _required_):
  Generated output
  - Examples: "The meaning of life is subjective and depends on individual perspectives."

- **`reasoning`** (`string`, _optional_):
  Generated reasoning for the final answer

- **`partial`** (`boolean`, _optional_):
  Whether the output is partial
  - Default: `false`

- **`error`** (`string`, _optional_):
  Error message if an error occurred



**Example Response**:

```json
{
  "output": "The meaning of life is subjective and depends on individual perspectives."
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/any-llm/enterprise \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "What is the meaning of life?"
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/any-llm/enterprise",
    arguments={
        "prompt": "What is the meaning of life?"
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/any-llm/enterprise", {
  input: {
    prompt: "What is the meaning of life?"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/any-llm/enterprise)
- [API Documentation](https://fal.ai/models/fal-ai/any-llm/enterprise/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/any-llm/enterprise)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)