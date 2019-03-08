SOURCES=$(wildcard *.md)
PDF=$(SOURCES:%.md=%.pdf)
HTML=$(SOURCES:%.md=%.html)
INSTALL=install -c -m 644
PYTHON=python
PANDOCARGS=-s
PANDOC=/usr/bin/pandoc

export LANGUAGE=C
export LC_ALL=C

all: html index.html

pdf: $(PDF)

html: $(HTML)

# This needs pandoc 1.9 or later to work
%.pdf: %.md
	$(PANDOC) -f markdown -o $*.pdf $*.md

%.html: %.md style.css
	$(PANDOC) $(PANDOCARGS) -H style.css -f markdown -t html --toc -o $*.html $*.md

docs.md: $(SOURCES) style.css
	$(PANDOC) $(PANDOCARGS) -H style.css -f markdown -t markdown --toc -o $@ *.md

index.html: $(SOURCES) style.css
	$(PANDOC) $(PANDOCARGS) -H style.css -f markdown -t html --toc -o $@ *.md


clean:
	$(RM) $(PDF) $(HTML) index.html
