from fastapi import APIRouter, HTTPException
from database import db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ClassCreate(BaseModel):
    lesson_name:  str
    unit_code:    str
    school:       Optional[str] = ''
    department:   Optional[str] = ''
    description:  Optional[str] = ''
    schedule:     Optional[str] = ''
    venue:        Optional[str] = ''
    credit_hours: Optional[int] = 3  
    

class ClassUpdate(BaseModel):
    lesson_name:  Optional[str] = None
    unit_code:    Optional[str] = None
    school:       Optional[str] = None
    department:   Optional[str] = None
    description:  Optional[str] = None
    schedule:     Optional[str] = None
    venue:        Optional[str] = None
    credit_hours: Optional[int] = None  
    

def fix(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

@router.get('/')
async def list_classes():
    docs = await db['classes'].find().to_list(200)
    return [fix(d) for d in docs]

@router.get('/{class_id}')
async def get_class(class_id: str):
    try:    doc = await db['classes'].find_one({'_id': ObjectId(class_id)})
    except: doc = await db['classes'].find_one({'unit_code': class_id})
    if not doc:
        raise HTTPException(status_code=404, detail='Class not found')
    return fix(doc)

@router.post('/', status_code=201)
async def create_class(data: ClassCreate):
    payload = data.dict()
    result  = await db['classes'].insert_one(payload)
    created = await db['classes'].find_one({'_id': result.inserted_id})
    return fix(created)  

@router.patch('/{class_id}')
async def update_class(class_id: str, data: ClassUpdate):
    try:    filt = {'_id': ObjectId(class_id)}
    except: filt = {'unit_code': class_id}
    update = {k: v for k, v in data.dict().items() if v is not None}
    await db['classes'].update_one(filt, {'$set': update})
    updated = await db['classes'].find_one(filt)
    if not updated:
        raise HTTPException(status_code=404, detail='Class not found')
    return fix(updated)  

@router.delete('/{class_id}')
async def delete_class(class_id: str):
    try:    filt = {'_id': ObjectId(class_id)}
    except: filt = {'unit_code': class_id}
    await db['classes'].delete_one(filt)
    return {'message': 'deleted'}