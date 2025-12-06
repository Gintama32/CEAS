from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from db.base import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(String, default="General", nullable=False)
    status = Column(String, default="draft", nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sections = relationship(
        "TemplateSection",
        order_by="TemplateSection.sort_index",
        cascade="all, delete-orphan",
        back_populates="template",
    )
    items = relationship(
        "TemplateItem",
        cascade="all, delete-orphan",
        back_populates="template",
    )

    @property
    def total_items(self) -> int:
        return sum(len(section.items) for section in self.sections)

    @property
    def section_count(self) -> int:
        return len(self.sections)


class TemplateSection(Base):
    __tablename__ = "template_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    csi_code = Column(String, nullable=True)
    csi_title = Column(String, nullable=True)
    sort_index = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    template = relationship("Template", back_populates="sections")
    items = relationship(
        "TemplateItem",
        order_by="TemplateItem.sort_index",
        cascade="all, delete-orphan",
        back_populates="section",
    )


class TemplateItem(Base):
    __tablename__ = "template_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("template_sections.id", ondelete="CASCADE"), nullable=True)
    catalog_data_id = Column(Integer, ForeignKey("data.id"), nullable=True)
    description = Column(Text, nullable=False)
    unit = Column(String, nullable=True)
    default_quantity = Column(Float, nullable=True)
    material_unit_cost = Column(Float, nullable=True)
    labor_unit_cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    sort_index = Column(Integer, default=0, nullable=False)

    template = relationship("Template", back_populates="items")
    section = relationship("TemplateSection", back_populates="items")


