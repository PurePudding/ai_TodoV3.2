import json
import datetime as dt
from typing import Union

from pydantic import BaseModel

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = 'sqlite:///./database.db'

engine = create_engine(DATABASE_URL, connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Share tables
class TodoShare(Base):
    __tablename__ = 'todo_shares'
    id = Column(Integer, primary_key=True)
    todo_id = Column(Integer, ForeignKey('todos.id', ondelete='CASCADE'))
    user_email = Column(String)

class ReminderShare(Base):
    __tablename__ = 'reminder_shares'
    id = Column(Integer, primary_key=True)
    reminder_id = Column(Integer, ForeignKey('reminders.id', ondelete='CASCADE'))
    user_email = Column(String)

class CalendarShare(Base):
    __tablename__ = 'calendar_shares'
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey('calendar_events.id', ondelete='CASCADE'))
    user_email = Column(String)

# Main tables
class Todo(Base):
    __tablename__ = 'todos'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    created_by = Column(String)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    shares = relationship("TodoShare", cascade="all, delete-orphan")

class Reminder(Base):
    __tablename__ = 'reminders'
    id = Column(Integer, primary_key=True, index=True)
    reminder_text = Column(String)
    importance = Column(String)
    created_by = Column(String)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    shares = relationship("ReminderShare", cascade="all, delete-orphan")

class CalendarEvent(Base):
    __tablename__ = 'calendar_events'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    event_from = Column(DateTime)
    event_to = Column(DateTime)
    created_by = Column(String)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    shares = relationship("CalendarShare", cascade="all, delete-orphan")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ToolCallFunction(BaseModel):
    name: str
    arguments: str | dict

class ToolCall(BaseModel):
    id: str
    function: ToolCallFunction

class Message(BaseModel):
    toolCalls: list[ToolCall]

class VapiRequest(BaseModel):
    message: Message

class TodoResponse(BaseModel):
    id: int
    title: str
    description: Union[str, None]
    completed: bool
    created_by: str
    created_at: dt.datetime
    shared_with: list[str]

    class Config:
        from_attributes = True

class ReminderResponse(BaseModel):
    id: int
    reminder_text: str
    importance: str
    created_by: str
    created_at: dt.datetime
    shared_with: list[str]

    class Config:
        from_attributes = True

class CalendarEventResponse(BaseModel):
    id: int
    title: str
    description: Union[str, None]
    event_from: dt.datetime
    event_to: dt.datetime
    created_by: str
    created_at: dt.datetime
    shared_with: list[str]

    class Config:
        from_attributes = True

@app.post('/create_todo/')
def create_todo(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'createTodo':
            args = tool_call.function.arguments
            break
    else:
        raise HTTPException(status_code=400, detail='Invalid Request')

    if isinstance(args, str):
        args = json.loads(args)

    title = args.get('title', '')
    description = args.get('description', '')
    created_by = args.get('created_by', '')

    todo = Todo(title=title, description=description, created_by=created_by)
    db.add(todo)
    db.commit()
    db.refresh(todo)

    return {
        'results': [
            {
                'toolCallId': tool_call.id,
                'result': TodoResponse(
                    id=todo.id,
                    title=todo.title,
                    description=todo.description,
                    completed=todo.completed,
                    created_by=todo.created_by,
                    created_at=todo.created_at,
                    shared_with=[share.user_email for share in todo.shares]
                ).dict()
            }
        ]
    }

@app.post('/get_todos/')
def get_todos(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'getTodos':
            args = tool_call.function.arguments
            if isinstance(args, str):
                args = json.loads(args)
            
            user_email = args.get('user_email')
            if not user_email:
                raise HTTPException(status_code=400, detail='Missing user_email')

            # Get todos created by user or shared with user
            todos = db.query(Todo).filter(
                (Todo.created_by == user_email) |
                (Todo.id.in_(
                    db.query(TodoShare.todo_id).filter(TodoShare.user_email == user_email)
                ))
            ).all()

            return {
                'results': [
                    {
                        'toolCallId': tool_call.id,
                        'result': [
                            TodoResponse(
                                id=todo.id,
                                title=todo.title,
                                description=todo.description,
                                completed=todo.completed,
                                created_by=todo.created_by,
                                created_at=todo.created_at,
                                shared_with=[share.user_email for share in todo.shares]
                            ).dict() 
                            for todo in todos
                        ]
                    }
                ]
            }
    
    raise HTTPException(status_code=400, detail='Invalid Request')

@app.post('/complete_todo/')
def complete_todo(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'completeTodo':
            args = tool_call.function.arguments
            break
    else:
        raise HTTPException(status_code=400, detail='Invalid Request')

    if isinstance(args, str):
        args = json.loads(args)

    todo_id = args.get('id')
    created_by = args.get('created_by')

    if not todo_id or not created_by:
        raise HTTPException(status_code=400, detail='Missing required fields')

    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        (Todo.created_by == created_by) |
        (Todo.id.in_(
            db.query(TodoShare.todo_id).filter(TodoShare.user_email == created_by)
        ))
    ).first()

    if not todo:
        raise HTTPException(status_code=404, detail='Todo not found or access denied')

    todo.completed = True
    db.commit()
    db.refresh(todo)

    return {
        'results': [
            {
                'toolCallId': tool_call.id,
                'result': TodoResponse(
                    id=todo.id,
                    title=todo.title,
                    description=todo.description,
                    completed=todo.completed,
                    created_by=todo.created_by,
                    created_at=todo.created_at,
                    shared_with=[share.user_email for share in todo.shares]
                ).dict()
            }
        ]
    }

@app.post('/share_todo/')
def share_todo(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'shareTodo':
            args = tool_call.function.arguments
            break
    else:
        raise HTTPException(status_code=400, detail='Invalid Request')

    if isinstance(args, str):
        args = json.loads(args)

    todo_id = args.get('todo_id')
    user_email = args.get('user_email')

    if not todo_id or not user_email:
        raise HTTPException(status_code=400, detail='Missing required fields')

    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail='Todo not found')

    # Check if already shared
    existing_share = db.query(TodoShare).filter(
        TodoShare.todo_id == todo_id,
        TodoShare.user_email == user_email
    ).first()

    if not existing_share:
        share = TodoShare(todo_id=todo_id, user_email=user_email)
        db.add(share)
        db.commit()

    return {
        'results': [
            {
                'toolCallId': tool_call.id,
                'result': 'success'
            }
        ]
    }

# Similar endpoints for Reminders and Calendar Events...
@app.post('/add_reminder/')
def add_reminder(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'addReminder':
            args = tool_call.function.arguments
            if isinstance(args, str):
                args = json.loads(args)
            
            reminder_text = args.get('reminder_text')
            importance = args.get('importance')
            created_by = args.get('created_by')
            
            if not all([reminder_text, importance, created_by]):
                raise HTTPException(status_code=400, detail="Missing required fields")
            
            reminder = Reminder(
                reminder_text=reminder_text,
                importance=importance,
                created_by=created_by
            )
            db.add(reminder)
            db.commit()
            db.refresh(reminder)
            
            return {
                'results': [{
                    'toolCallId': tool_call.id,
                    'result': ReminderResponse(
                        id=reminder.id,
                        reminder_text=reminder.reminder_text,
                        importance=reminder.importance,
                        created_by=reminder.created_by,
                        created_at=reminder.created_at,
                        shared_with=[share.user_email for share in reminder.shares]
                    ).dict()
                }]
            }
    
    raise HTTPException(status_code=400, detail="Invalid request")

@app.post('/share_reminder/')
def share_reminder(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'shareReminder':
            args = tool_call.function.arguments
            if isinstance(args, str):
                args = json.loads(args)
            
            reminder_id = args.get('reminder_id')
            user_email = args.get('user_email')
            
            if not all([reminder_id, user_email]):
                raise HTTPException(status_code=400, detail="Missing required fields")
            
            reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
            if not reminder:
                raise HTTPException(status_code=404, detail="Reminder not found")
            
            existing_share = db.query(ReminderShare).filter(
                ReminderShare.reminder_id == reminder_id,
                ReminderShare.user_email == user_email
            ).first()
            
            if not existing_share:
                share = ReminderShare(reminder_id=reminder_id, user_email=user_email)
                db.add(share)
                db.commit()
            
            return {
                'results': [{
                    'toolCallId': tool_call.id,
                    'result': 'success'
                }]
            }
    
    raise HTTPException(status_code=400, detail="Invalid request")

@app.post('/add_calendar_entry/')
def add_calendar_entry(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'addCalendarEntry':
            args = tool_call.function.arguments
            if isinstance(args, str):
                args = json.loads(args)
            
            title = args.get('title')
            description = args.get('description', '')
            event_from = args.get('event_from')
            event_to = args.get('event_to')
            created_by = args.get('created_by')
            
            if not all([title, event_from, event_to, created_by]):
                raise HTTPException(status_code=400, detail="Missing required fields")
            
            try:
                event_from_dt = dt.datetime.fromisoformat(event_from)
                event_to_dt = dt.datetime.fromisoformat(event_to)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")
            
            event = CalendarEvent(
                title=title,
                description=description,
                event_from=event_from_dt,
                event_to=event_to_dt,
                created_by=created_by
            )
            db.add(event)
            db.commit()
            db.refresh(event)
            
            return {
                'results': [{
                    'toolCallId': tool_call.id,
                    'result': CalendarEventResponse(
                        id=event.id,
                        title=event.title,
                        description=event.description,
                        event_from=event.event_from,
                        event_to=event.event_to,
                        created_by=event.created_by,
                        created_at=event.created_at,
                        shared_with=[share.user_email for share in event.shares]
                    ).dict()
                }]
            }
    
    raise HTTPException(status_code=400, detail="Invalid request")

@app.post('/share_calendar_entry/')
def share_calendar_entry(request: VapiRequest, db: Session = Depends(get_db)):
    for tool_call in request.message.toolCalls:
        if tool_call.function.name == 'shareCalendarEntry':
            args = tool_call.function.arguments
            if isinstance(args, str):
                args = json.loads(args)
            
            event_id = args.get('event_id')
            user_email = args.get('user_email')
            
            if not all([event_id, user_email]):
                raise HTTPException(status_code=400, detail="Missing required fields")
            
            event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
            if not event:
                raise HTTPException(status_code=404, detail="Calendar event not found")
            
            existing_share = db.query(CalendarShare).filter(
                CalendarShare.event_id == event_id,
                CalendarShare.user_email == user_email
            ).first()
            
            if not existing_share:
                share = CalendarShare(event_id=event_id, user_email=user_email)
                db.add(share)
                db.commit()
            
            return {
                'results': [{
                    'toolCallId': tool_call.id,
                    'result': 'success'
                }]
            }
    
    raise HTTPException(status_code=400, detail="Invalid request")