from fastapi import APIRouter
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
    credit_hours: Optional[str] = '3'

class ClassUpdate(BaseModel):
    lesson_name:  Optional[str] = None
    school:       Optional[str] = None
    department:   Optional[str] = None
    description:  Optional[str] = None
    schedule:     Optional[str] = None
    venue:        Optional[str] = None
    credit_hours: Optional[str] = None

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
    return fix(doc)

@router.post('/')
async def create_class(data: ClassCreate):
    result = await db['classes'].insert_one(data.dict())
    return {'id': str(result.inserted_id)}

@router.patch('/{class_id}')
async def update_class(class_id: str, data: ClassUpdate):
    try:    filt = {'_id': ObjectId(class_id)}
    except: filt = {'unit_code': class_id}
    update = {k: v for k, v in data.dict().items() if v is not None}
    await db['classes'].update_one(filt, {'$set': update})
    return {'message': 'updated'}

@router.delete('/{class_id}')
async def delete_class(class_id: str):
    try:    filt = {'_id': ObjectId(class_id)}
    except: filt = {'unit_code': class_id}
    await db['classes'].delete_one(filt)
    return {'message': 'deleted'}