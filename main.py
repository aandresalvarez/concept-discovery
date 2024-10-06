import os
from typing import Union, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from workflow import testurl

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DisambiguationOption(BaseModel):
    label: str
    domain: str
    definition: str
    usage: str
    medicalContext: str
    synonyms: List[str]
    relatedSymptoms: List[str]


class SearchResponse(BaseModel):
    inputTerm: str
    language: str
    disambiguationOptions: List[DisambiguationOption]


@app.get("/api/search", response_model=SearchResponse)
async def search(term: str = Query(..., min_length=1),
                 language: str = Query("en")):
    try:
        # In a real-world scenario, you would query a database or external API here
        # This is a mock response for demonstration purposes
        return SearchResponse(
            inputTerm=term,
            language=language,
            disambiguationOptions=[
                DisambiguationOption(
                    label=term.capitalize(),
                    domain="Drugs",
                    definition=
                    f"A medication used to reduce pain, fever, or inflammation. It is also used as an antiplatelet agent to prevent blood clots.",
                    usage=
                    f"{term.capitalize()} is commonly prescribed for patients at risk of heart attacks or strokes.",
                    medicalContext=
                    "Cardiology, General Medicine, Pain Management.",
                    synonyms=["acetylsalicylic acid", "ASA"],
                    relatedSymptoms=["chest pain", "inflammation", "fever"]),
                DisambiguationOption(
                    label=f"{term.capitalize()} Usage",
                    domain="Observations",
                    definition=
                    f"An observation related to the patient's use of {term} as part of their treatment plan.",
                    usage=
                    f"The doctor noted that the patient has been taking {term} daily for 10 years.",
                    medicalContext=
                    "Patient history, ongoing treatment monitoring.",
                    synonyms=[f"{term} therapy", f"daily {term}"],
                    relatedSymptoms=["blood thinning", "regular use"]),
                DisambiguationOption(
                    label=f"{term.capitalize()} Measurement",
                    domain="Measurements",
                    definition=
                    f"A laboratory test or clinical measurement to determine the concentration of {term} in the bloodstream.",
                    usage=
                    f"{term.capitalize()} levels were measured to ensure the patient was not at risk of toxicity.",
                    medicalContext="Toxicology, Pharmacology.",
                    synonyms=[
                        f"{term} blood levels", f"{term.upper()} measurement"
                    ],
                    relatedSymptoms=[f"{term} toxicity", "overdose"])
            ])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api")
def read_root():
    return {"Hello": "World"}


@app.get("/api/test")
def test1(name: str):
    return testurl(name)


@app.get("/api/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


# Serve React frontend only if the dist directory exists
if os.path.exists("frontend/dist"):
    app.mount("/",
              StaticFiles(directory="frontend/dist", html=True),
              name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
